import { logger } from "../log/logger.js";
import { Timer } from "../log/timer.js";
import { parseAnswer, getModelData, sleep } from "./util.js";
import { shortObjHash } from "../util.js";

export const BaseAI = class {
  constructor(options) {
    const apiKeyEnvVariable = this.constructor.apiKeyEnvVariable;
    let { cache, maxTokens, maxRetries, retryMsec, model, apiKey } =
      Object.assign(
        {
          maxRetries: 10,
          retryMsec: 5000,
          model: this.constructor.defaultModel,
          apiKey: apiKeyEnvVariable ? process.env[apiKeyEnvVariable] : null,
        },
        options,
      );

    if (!apiKey && !this.constructor.optionalApiKey) {
      throw new Error(
        `FetchFox is missing API key for ${this.constructor.name}. Enter it using environment variable ${apiKeyEnvVariable} or pass it in to the constructor`,
      );
    }

    if (cache) this.cache = cache;

    const providers = [
      "openai",
      "anthropic",
      "ollama",
      "mistral",
      "groq",
      "gemini",
      "google",
    ];
    for (const p of providers) {
      if (model.startsWith(p + ":")) {
        model = model.replace(p + ":", "");
      }
    }

    this.model = model;
    this.apiKey = apiKey;

    this.maxRetries = maxRetries;
    this.retryMsec = retryMsec;
    this.usage = { input: 0, output: 0, total: 0 };
    this.cost = { input: 0, output: 0, total: 0 };
    this.runtime = { sec: 0, msec: 0 };

    const provider = this.constructor.name.toLowerCase();
    const data = getModelData(provider, model);
    if (data) {
      this.modelData = data;
      this.maxTokens = data.max_input_tokens;
    } else {
      logger.warn(`Couldn't find model data for ${provider} ${model}`);
      this.maxTokens = 10000;
    }

    if (options?.maxTokens) this.maxTokens = maxTokens;

    this.signal = options?.signal;
  }

  toString() {
    return `[${this.constructor.name} ${this.model}]`;
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

  cacheKey(prompt, { systemPrompt, format, cacheHint, schema }) {
    const hash = shortObjHash({
      prompt,
      systemPrompt,
      format,
      cacheHint,
      schema,
    });
    const promptPart = prompt.replaceAll(/[^A-Za-z0-9]+/g, "-").substr(0, 32);
    return `ai-${this.constructor.name}-${this.model}-${promptPart}-${hash}`;
  }

  async getCache(prompt, options) {
    if (!this.cache) return;

    const { systemPrompt, format, cacheHint, schema } = options || {};
    const key = this.cacheKey(prompt, {
      systemPrompt,
      format,
      cacheHint,
      schema,
    });
    let result;
    try {
      result = await this.cache.get(key);
    } catch (e) {
      logger.error(`${this} Error while getting cache: ${e}`);
      return;
    }
    const outcome = result ? "(hit)" : "(miss)";
    logger.debug(
      `Prompt cache ${outcome} for ${key} for prompt "${prompt.substr(0, 32)}..."`,
    );
    return result;
  }

  async setCache(prompt, options, val) {
    if (!this.cache) return;

    const { systemPrompt, format, cacheHint, schema } = options || {};
    const key = this.cacheKey(prompt, {
      systemPrompt,
      format,
      cacheHint,
      schema,
    });
    logger.debug(
      `Set prompt cache for ${key} for prompt ${prompt.substr(0, 16)}... to ${(JSON.stringify(val) || "" + val).substr(0, 32)}..."`,
    );
    return this.cache.set(key, val, "prompt");
  }

  addUsage(usage) {
    for (const key in this.usage) {
      this.usage[key] += usage[key];
    }
    if (this.modelData) {
      this.cost.input = this.usage.input * this.modelData.input_cost_per_token;
      this.cost.output =
        this.usage.output * this.modelData.output_cost_per_token;
      this.cost.total = this.cost.input + this.cost.output;
    }
  }

  async *stream(prompt, options) {
    let tokens;
    try {
      tokens = await this.countTokens(prompt);
    } catch (e) {
      logger.error(`${this} Error while counting tokens for stream: ${e}`);
      return;
    }
    logger.info(
      `Streaming ${this} for prompt with ${prompt.length} bytes, ${tokens} tokens`,
    );

    const { format, cacheHint } = Object.assign({ format: "text" }, options);
    let cached;
    try {
      cached = await this.getCache(prompt, options);
    } catch (e) {
      logger.error(`${this} Error while getting cache: ${e}`);
    }
    if (cached) {
      if (format == "jsonl") {
        for (const r of cached) {
          yield Promise.resolve(r);
        }
      } else {
        yield Promise.resolve(cached);
      }
      return;
    }

    let usage = { input: 0, output: 0, total: 0 };
    const start = new Date().getTime();

    let err;
    let answer = "";
    let buffer = "";
    const ctx = { prompt, format, usage, answer, buffer, cacheHint };

    let result;
    try {
      let retries = options?.retries ?? 2;
      let done = false;

      while (!done) {
        try {
          for await (const chunk of this.inner(prompt, options)) {
            if (this.signal?.aborted) {
              logger.debug(`${this} Already aborted, break inner`);
              done = true;
              break;
            }

            const norm = this.normalizeChunk(chunk);
            const parsed = this.parseChunk(norm, ctx);

            if (!parsed) continue;

            if (format == "jsonl") {
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
          if (retries-- <= 0) {
            logger.error(`${this} No retries left after: ${e}`);
            throw e;
          }

          logger.warn(`${this} Retrying after error (${retries} left): ${e}`);
          await sleep(4000);
        }
      } // Retry loop
    } catch (e) {
      err = e;
      throw e;
    } finally {
      const msec = new Date().getTime() - start;
      this.runtime.msec += msec;
      this.runtime.sec += msec / 1000;

      if (err) {
        logger.warn(`${this} Error during AI stream, not caching`);
      } else {
        this.setCache(prompt, options, result);
      }
    }
  }

  async ask(prompt, options) {
    let tokens;
    try {
      tokens = await this.countTokens(prompt);
    } catch (e) {
      logger.error(`${this} Error while counting tokens for ask: ${e}`);
      return;
    }
    logger.info(
      `Asking ${this} for prompt with ${prompt.length} bytes, ${tokens} tokens`,
    );

    const before = {
      usage: Object.assign({}, this.usage),
      cost: Object.assign({}, this.cost),
    };

    let result;
    let retries = 3;
    const retryMsec = 5000;
    while (true) {
      try {
        for await (const chunk of this.stream(prompt, options)) {
          result = chunk;
        }
      } catch (e) {
        logger.error(`Caught ${this} error: ${e}`);

        if (!e.status || --retries <= 0) {
          throw e;
        }

        logger.debug(
          `Caught error in ${this}, sleep for ${retryMsec} and try again. ${retries} tries left: ${e.status} ${e}`,
        );
        await sleep(retryMsec);
      }

      break;
    }

    if (!result) {
      logger.warn(
        `Got no response for prompt ${prompt.substr(0, 100)}: ${result}`,
      );
      result = {}; // Cache it as empty dict
    }

    const after = {
      usage: Object.assign({}, this.usage),
      cost: Object.assign({}, this.cost),
    };

    result.usage = {
      input: after.usage.input - before.usage.input,
      output: after.usage.output - before.usage.output,
      total: after.usage.total - before.usage.total,
    };
    result.cost = {
      input: after.cost.input - before.cost.input,
      output: after.cost.output - before.cost.output,
      total: after.cost.total - before.cost.total,
    };

    return result;
  }

  parseChunk(chunk, ctx) {
    if (chunk.usage) {
      const { input, output, total } = chunk.usage;

      this.addUsage({
        input: input - ctx.usage.input,
        output: output - ctx.usage.output,
        total: total - ctx.usage.total,
      });

      ctx.usage.input = input;
      ctx.usage.output = output;
      ctx.usage.total = input + output;
    }

    let delta = chunk.message;
    if (!delta) return;

    ctx.answer += delta;
    ctx.buffer += delta;

    if (ctx.format == "jsonl") {
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
      const parsed = parseAnswer("" + ctx.buffer, ctx.format);
      ctx.buffer = "";
      return {
        delta: parsed,
        partial: parseAnswer(ctx.answer, ctx.format),
        usage: ctx.usage,
      };
    }
  }
};
