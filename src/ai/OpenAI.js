import OpenAILib from 'openai';
import { BaseAI } from './BaseAI.js';

export const OpenAI = class extends BaseAI {
  static apiKeyEnvVariable = 'OPENAI_API_KEY';
  static defaultModel = 'gpt-4o-mini';

  async countTokens(str) {
    // tiktoken is slow and CPU intensive to run, so for now
    // just (over) estimate the nubmer of tokens. This is usually
    // fine, since the promps chunk and iterate anyways.
    // TODO: find a way to efficiently count tokens
    return str.length / 2;

    // const timer = options?.timer || new Timer();
    // timer.push(`${this}.countTokens`);
    // try {
    //   // Override this in derived classes
    //   const enc = encoding_for_model(this.model);
    //   return enc.encode(str).length;
    // } finally {
    //   timer.pop();
    // }
  }

  normalizeChunk(chunk) {
    const { id, model } = chunk;

    let message;
    if (chunk.choices?.length) {
      const first = chunk.choices[0];
      if (first.message) {
        message = first.message.content;
      } else if (first.delta) {
        message = first.delta.content;
      }
    }

    let usage;
    if (chunk.usage) {
      usage = {
        input: chunk.usage.prompt_tokens,
        output: chunk.usage.completion_tokens,
        total: chunk.usage.prompt_tokens + chunk.usage.completion_tokens,
      };
    }

    return { id, model, message, usage };
  }

  async *inner(prompt, options) {
    if (this.signal?.aborted) {
      this.logger.debug(`${this} Already aborted, return early`);
      return;
    }

    const openai = new OpenAILib({
      apiKey: this.apiKey,
      baseURL: this.baseURL,
    });

    const systemPrompt = 'Act as an advanced web scraping assistant, adept at understanding HTML and CSS and producing accurate code and structured output.  You will help navigate a page by identifying and selecting relevant elements to click , particularly for accepting cookies and reaching the next page of content.  Never try to select an element that that does not exist.';

    const args = {
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
      stream: true,
      stream_options: { include_usage: true },
    };
    args.messages = [
      { role: 'system', content: systemPrompt },
      ...args.messages,
    ]
    if (options?.temperature && !this.model.includes('o3')) {
      args.temperature = options.temperature;
    }
    if (options?.topP && !this.model.includes('o3')) {
      args.top_p = options.topP;
    }

    // Add OpenRouter fallback models if provided
    if (this.provider == 'openrouter' && this.fallbacks) {
      args.extra_body = { models: this.fallbacks };
    }

    if (options?.imageUrl) {
      this.logger.debug(`Adding image URL to prompt: ${options.imageUrl.substr(0, 120)}`);
      const existing = args.messages[0].content;
      args.messages[0].content = [
        existing,
        {
          type: 'image_url',
          image_url: { url:  options.imageUrl },
        },
      ];
    }

    const canStream = this.model.indexOf('o1') == -1;
    if (!canStream) {
      delete args.stream;
      delete args.stream_options;
    }

    const aiOptions = {};

    // OpenAI does not remove listeners after an aborted request,
    // so we create our own local listenert and forward the abort().
    // After we're done, we remove the listener. This prevents
    // memory leaks via excess listeners.
    let listener;
    let localSignal;
    if (this.signal) {
      const controller = new AbortController();
      localSignal = controller.signal;
      listener = () => {
        controller.abort();
      };
      this.signal.addEventListener('abort', listener);
      aiOptions.signal = localSignal;
    }

    let completion;
    try {
      completion = await openai.chat.completions.create(args, aiOptions);
      if (canStream) {
        this.logger.debug(`${this} Stream the completion`);
        for await (const chunk of completion) {
          yield Promise.resolve(chunk);
        }
      } else {
        const answer = await completion;
        yield Promise.resolve(answer);
      }
    } catch (e) {
      if (e.constructor.name == 'APIUserAbortError') {
        this.logger.warn(`${this} Aborted while creating: ${e}`);
        return;
      }

      this.logger.error(`${this} Caught error while making completion: ${e}`);
      throw e;
    } finally {
      if (listener) {
        this.signal.removeEventListener('abort', listener);
      }
    }
  }
}
