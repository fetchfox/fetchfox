import { RateLimiter } from 'limiter';
import { getAI } from './index.js';
import { logger as defaultLogger } from '../log/logger.js';
import { Timer } from '../log/timer.js';
import { parseAnswer, sleep, getModelData } from './util.js';
import { shortObjHash } from '../util.js';


export const BaseAI = class {
  constructor(options) {
    const apiKeyEnvVariable = this.constructor.apiKeyEnvVariable;
    let {
      cache,
      logger,
      maxTokens,
      maxRetries,
      retryMsec,
      model,
      apiKey,
      advanced,
    } =
    Object.assign(
      {
        maxRetries: 10,
        retryMsec: 5000,
        model: this.constructor.defaultModel,
        apiKey: (apiKeyEnvVariable ? process.env[apiKeyEnvVariable] : null),
      },
      options);

    if (!apiKey && !this.constructor.optionalApiKey) {
      throw new Error(`FetchFox is missing API key for ${this.constructor.name}. Enter it using environment variable ${apiKeyEnvVariable} or pass it in to the constructor`);
    }

    if (cache) this.cache = cache;
    this.logger = logger || defaultLogger;

    const providers = [
      'openai',
      'anthropic',
      'ollama',
      'mistral',
      'groq',
      'gemini',
      'google',
    ];
    for (const p of providers) {
      if (model.startsWith(p + ':')) {
        model = model.replace(p + ':', '');
      }
    }

    this._advanced = advanced ? getAI(advanced) : null;

    this.provider = this.constructor.name.toLowerCase();
    this.model = model;
    this.apiKey = apiKey;

    this.pricing = {};
    this.maxRetries = maxRetries;
    this.retryMsec = retryMsec;

    this.stats = {
      tokens: { input: 0, output: 0, total: 0 },
      cost: { input: 0, output: 0, total: 0 },
      runtime: { sec: 0, msec: 0 },
      requests: { attempts: 0, errors: 0, failures: 0  },
    }

    this.baseURL = options?.baseURL;

    this.tpm = options?.tpm || 150000000;
    this.limiter = new RateLimiter({
      tokensPerInterval: this.tpm,
      interval: 'minute',
    });

    if (maxTokens) this.maxTokens = maxTokens;
    this.signal = options?.signal;
  }

  toString() {
    return `[${this.constructor.name} ${this.model}]`;
  }

  async init() {
    if (this.didInit) {
      return;
    }

    const p = this._advanced ? this._advanced.init() : Promise.resolve();

    const data = await getModelData(this.provider, this.model, this.cache);
    this.maxTokens = data.maxTokens;
    this.pricing = data.pricing;
    this.didInit = true;

    await p;
  }

  get advanced() {
    return this._advanced || this;
  }

  get id() {
    return this.provider + ':' + this.model;
  }

  async limitReady(str, options) {
    const tokens = await this.countTokens(str, options);
    while (true) {
      const r = this.limiter.getTokensRemaining();
      this.logger.info(`${this} Check rate limit: tpm=${this.tpm}, tokens available=${r}`);
      if (this.limiter.tryRemoveTokens(tokens) || r == this.tpm) {
        return tokens;
      }

      this.logger.warn(`${this} Waiting for rate limit, tpm=${this.tpm}`);
      await new Promise(ok => setTimeout(ok, 5000));
    }
    return tokens;
  }

  async countTokens(str, options) {
    const timer = options?.timer || new Timer();
    timer.push(`${this}.countTokens`);

    try {
      // Override this in derived classes
      return str.length / 2.5;
    } finally {
      timer.pop();
    }
  }

  cacheKey(prompt, { systemPrompt, format, cacheHint }) {
    const hash = shortObjHash({ prompt, systemPrompt, format, cacheHint });
    const promptPart = prompt.replaceAll(/[^A-Za-z0-9]+/g, '-').substr(0, 32);
    return `ai-${this.constructor.name}-${this.model}-${promptPart}-${hash}`
  }

  async getCache(prompt, options) {
    if (!this.cache) return;

    const { systemPrompt, format, cacheHint } = options || {};
    const key = this.cacheKey(prompt, { systemPrompt, format, cacheHint });
    let result;
    try {
      result = await this.cache.get(key);
    } catch (e) {
      this.logger.error(`${this} Error while getting cache: ${e}`);
      return;
    }
    const outcome = result ? '(hit)' : '(miss)';
    if (!result) {
      this.logger.trace('miss');
    }
    this.logger.debug(`Prompt cache ${outcome} for ${key} for prompt "${prompt.substr(0, 32)}..."`);


    return result;
  }

  async setCache(prompt, options, val) {
    if (!this.cache) return;

    const { systemPrompt, format, cacheHint } = options || {};
    const key = this.cacheKey(prompt, { systemPrompt, format, cacheHint });
    this.logger.debug(`Set prompt cache for ${key} for prompt ${prompt.substr(0, 16)}... to ${(JSON.stringify(val) || '' + val).substr(0, 32)}..."`);
    return this.cache.set(key, val, 'prompt');
  }

  async *stream(prompt, options) {
    await this.init();

    const tokens = await this.limitReady(prompt);
    this.logger.info(`Streaming ${this} for prompt with ${prompt.length} bytes, ${tokens} tokens`);

    const { format, cacheHint } = Object.assign({ format: 'text' }, options);
    let cached;
    try {
      cached = await this.getCache(prompt, options);
    } catch (e) {
      this.logger.error(`${this} Error while getting cache: ${e}`);
    }
    if (cached) {
      if (format == 'jsonl') {
        for (const r of cached) {
          yield Promise.resolve(r);
        }
      } else {
        yield Promise.resolve(cached);
      }
      return;
    }

    let usage = { input: 0, output: 0, total: 0 };

    let err;
    let answer = '';
    let buffer = '';
    const ctx = { prompt, format, usage, answer, buffer, cacheHint };

    let result;
    let start;
    try {
      let retries = Math.min(this.maxRetries, options?.retries ?? 2);
      let done = false;

      while (!done) {
        // Track start time relative to the  successful attempt
        this.stats.requests.attempts++;
        start = (new Date()).getTime();

        try {
          for await (const chunk of this.inner(prompt, options)) {
            if (this.signal?.aborted) {
              this.logger.debug(`${this} Already aborted, break inner`);
              done = true;
              break;
            }

            const norm = this.normalizeChunk(chunk);
            const parsed = this.parseChunk(norm, ctx);

            if (norm.usage) {
              this.stats.tokens.input += norm.usage.input || 0;
              this.stats.tokens.output += norm.usage.output || 0;
              this.stats.tokens.total = this.stats.tokens.input + this.stats.tokens.output;

              if (this.pricing) {
                this.stats.cost.input = this.stats.tokens.input * this.pricing.input;
                this.stats.cost.output = this.stats.tokens.output * this.pricing.output;
                this.stats.cost.total = this.stats.cost.input + this.stats.cost.output;
              }
            }

            if (!parsed) continue;

            if (format == 'jsonl') {
              if (!result) {
                result = [];
              }

              for (const d of parsed.delta) {
                const r = {
                  delta: d,
                  partial: parsed.partial,
                  usage: parsed.usage,
                };
                result.push(r);
                yield Promise.resolve(r);
              }
            } else {
              result = parsed;
              yield Promise.resolve(parsed);
            }
          }

          // Completed without exception, break out of retry loop
          done = true;

        } catch (e) {
          this.stats.requests.errors++;

          if (retries-- <= 0) {
            this.logger.error(`${this} No retries left after: ${e}`);
            throw e;
          }

          this.logger.warn(`${this} Retrying after error (${retries} left): ${e}`);
          await sleep(4000);
        }
      } // Retry loop

    } catch (e) {
      this.stats.requests.failures++;

      err = e;
      throw e;

    } finally {
      const msec = (new Date()).getTime() - start;
      this.stats.runtime.msec += msec;
      this.stats.runtime.sec += msec / 1000;

      if (err) {
        this.logger.warn(`${this} Error during AI stream, not caching`);
      } else {
        this.setCache(prompt, options, result);
      }
    }
  }

  async ask(prompt, options) {
    const tokens = await this.limitReady(prompt);
    this.logger.info(`Asking ${this} for prompt with ${prompt.length} bytes, ${tokens} tokens`);

    let result;
    let retries = Math.min(this.maxRetries, options?.retries ?? 2);
    const retryMsec= 5000;
    while (true) {
      try {
        for await (const chunk of this.stream(prompt, options)) {
          result = chunk;
        }

      } catch(e) {
        this.logger.error(`Caught ${this} error: ${e}`);

        if (!e.status || --retries <= 0) {
          throw e;
        }

        this.logger.debug(`Caught error in ${this}, sleep for ${retryMsec} and try again. ${retries} tries left: ${e.status} ${e}`);
        await sleep(retryMsec);
      }

      break;
    }

    if (!result) {
      this.logger.warn(`Got no response for prompt ${prompt.substr(0, 100)}: ${result}`);
      result = {};  // Cache it as empty dict
    }

    return result;
  }

  parseChunk(chunk, ctx) {
    if (chunk.usage) {
      const { input, output } = chunk.usage;

      ctx.usage.input = input;
      ctx.usage.output = output;
      ctx.usage.total = input + output;
    }

    let delta = chunk.message;
    if (!delta) return;

    ctx.answer += delta;
    ctx.buffer += delta;

    if (ctx.format == 'jsonl') {
      const { result, leftover } = parseAnswer(ctx.buffer, ctx.format);
      if (result.length) {
        ctx.buffer = leftover;
        return {
          delta: result,
          partial: parseAnswer(ctx.answer, ctx.format),
          usage: ctx.usage,
        };
      }
    } else {
      const parsed = parseAnswer('' + ctx.buffer, ctx.format);
      ctx.buffer = '';
      return {
        delta: parsed,
        partial: parseAnswer(ctx.answer, ctx.format),
        usage: ctx.usage,
      };
    }
  }
}
