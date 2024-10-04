import crypto from 'crypto';
import { logger } from '../log/logger.js';
import { parseAnswer, getModelData, sleep } from './util.js';

export const BaseAI = class {
  constructor(model, options) {
    const { cache, maxTokens, maxRetries, retryMsec } = Object.assign(
      {},
      { maxRetries: 10, retryMsec: 5000 },
      options);
    if (cache) this.cache = cache;
    this.model = model;
    this.maxRetries = maxRetries;
    this.retryMsec = retryMsec;
    this.usage = { input: 0, output: 0, total: 0 };
    this.cost = { input: 0, output: 0, total: 0 };
    this.elapsed = { sec: 0, msec: 0 };

    const provider = this.constructor.name.toLowerCase();
    const data = getModelData(provider, model);
    if (data) {
      this.modelData = data;
      this.maxTokens = data.max_input_tokens;
    } else {
      logger.warn(`Couldn't find model data for ${provider} ${model}`);
      this.maxTokens = 10000;
    }
  }

  toString() {
    return `[${this.constructor.name} ${this.model}]`;
  }

  cacheKey(prompt, { systemPrompt, format, cacheHint }) {
    const hash = crypto
      .createHash('sha256')
      .update(JSON.stringify({ prompt, systemPrompt, format, cacheHint }))
      .digest('hex')
      .substr(0, 16);
    const promptPart = prompt.replaceAll(/[^A-Za-z0-9]+/g, '-').substr(0, 32);
    return `ai-${this.constructor.name}-${this.model}-${promptPart}-${hash}`
  }

  async getCache(prompt, options) {
    if (!this.cache) return;

    const { systemPrompt, format, cacheHint } = options || {};
    const key = this.cacheKey(prompt, { systemPrompt, format, cacheHint });
    const result = await this.cache.get(key);
    const outcome = result ? '(hit)' : '(miss)';
    logger.info(`Prompt cache ${outcome} for ${key} for prompt "${prompt.substr(0, 32)}..."`);

    return result;
  }

  async setCache(prompt, options, val) {
    if (!this.cache) return;

    const { systemPrompt, format, cacheHint } = options || {};
    const key = this.cacheKey(prompt, { systemPrompt, format, cacheHint });
    logger.verbose(`Set prompt cache for ${key} for prompt ${prompt.substr(0, 16)}... to ${(JSON.stringify(val) || '' + val).substr(0, 32)}..."`);
    return this.cache.set(key, val, 'prompt');
  }

  addUsage(usage) {
    for (const key in this.usage) {
      this.usage[key] += usage[key];
    }
    if (this.modelData) {
      this.cost.input = this.usage.input * this.modelData.input_cost_per_token;
      this.cost.output = this.usage.output * this.modelData.output_cost_per_token;
      this.cost.total = this.cost.input + this.cost.output;
    }
  }

  async *stream(prompt, options) {
    const { format, cacheHint } = Object.assign({ format: 'text' }, options);
    let usage = { input: 0, output: 0, total: 0 };
    let answer = '';
    let buffer = '';

    const ctx = { prompt, format, usage, answer, buffer, cacheHint };
    for await (const chunk of this.inner(prompt, options)) {
      console.log('stream got:', chunk.choices);
      const parsed = this.parseChunk(
        this.normalizeChunk(chunk),
        ctx);

      console.log('buffer:', ctx.buffer);

      if (!parsed) continue;

      console.log('format:', format);
      console.log('parsed:', parsed);

      if (format == 'jsonl') {
        console.log('return jsonl');
        for (const d of parsed.delta) {
          yield Promise.resolve({
            delta: d,
            partial: parsed.partial,
            usage: parsed.usage });
        }
      } else {
        console.log('return else');
        yield Promise.resolve(parsed);
      }
    }
  }

  async ask(prompt, options) {
    const cached = await this.getCache(prompt, options);

    if (cached) {
      this.addUsage(cached.usage);
      this.elapsed.msec += cached.elapsed?.msec || 0;
      this.elapsed.sec += cached.elapsed?.sec || 0;
      return cached;
    }

    const before = {
      usage: Object.assign({}, this.usage),
      cost: Object.assign({}, this.cost),
    };

    const start = (new Date()).getTime();
    let result;
    let retries = 3;
    const retryMsec= 5000;
    while (true) {
      try {
        for await (const chunk of this.stream(prompt, options)) {
          result = chunk;
        }

      } catch(e) {
        logger.error(`Caught ${this} error: ${e}`);

        if (!e.status) {
          throw e;
        }
        if (--retries <= 0) {
          throw e;
        }

        logger.info(`Caught error in ${this}, sleep for ${retryMsec} and try again. ${retries} tries left: ${e.status} ${e}`);
        await sleep(retryMsec);

      }

      break;
    }

    const msec = (new Date()).getTime() - start;
    this.elapsed.msec += msec;
    this.elapsed.sec += msec / 1000;

    if (!result) {
      logger.warn(`Got no response for prompt ${prompt.substr(0, 100)}: ${result}`);
      result = {};  // Cache it as empty dict
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

    this.setCache(
      prompt,
      options,
      {
        delta: result.delta,
        partial: result.partial,
        cost: result.cost,
        usage: result.usage,
        elapsed: { msec, sec: msec / 1000 },
      });

    return result;
  }

  // gen(prompt, options) {
  //   logger.info(`AI generator for ${options.stream ? 'streaming' : 'blocking'} prompt "${prompt.substr(0, 32)}..."`);

  //   if (options.stream) {
  //     return this.stream(prompt, { format: 'jsonl' });
  //   } else {
  //     const that = this;
  //     return (async function *() {
  //       try {
  //         const result = await that.ask(prompt, { format: 'jsonl' });

  //         if (!result?.delta) {
  //           return;
  //         }
  //         for (let r of result.delta) {
  //           yield Promise.resolve({
  //             delta: r,
  //             partial: result.partial,
  //             usage: result.usage,
  //             cost: result.cost,
  //             elapsed: result.elapsed,
  //           });
  //         }
  //       } catch(e) {
  //         throw e;
  //       }
  //     })();
  //   }
  // }

  parseChunk(chunk, ctx) {
    if (chunk.usage) {
      const { input, output, total } = chunk.usage;

      this.addUsage({
        input: input - ctx.usage.input,
        output: output - ctx.usage.output,
        total: total - ctx.usage.total });

      ctx.usage.input = input;
      ctx.usage.output = output;
      ctx.usage.total = input + output;
    }

    let delta = chunk.message;
    if (!delta) return;

    ctx.answer += delta;
    ctx.buffer += delta;

    const cache = () => {
      this.setCache(
        ctx.prompt,
        { format: ctx.format, cacheHint: ctx.cacheHint },
        { answer: parseAnswer(ctx.answer, ctx.format),
          usage: ctx.usage });
    }

    if (ctx.format == 'jsonl') {
      const parsed = parseAnswer(ctx.buffer, ctx.format);
      cache();
      if (parsed.length) {
        ctx.buffer = '';
        return {
          delta: parsed,
          partial: parseAnswer(ctx.answer, ctx.format),
          usage: ctx.usage,
        };
      }
    } else {
      const parsed = parseAnswer('' + ctx.buffer, ctx.format);
      ctx.buffer = '';
      cache();
      return {
        delta: parsed,
        partial: parseAnswer(ctx.answer, ctx.format),
        usage: ctx.usage,
      };
    }
  }
}
