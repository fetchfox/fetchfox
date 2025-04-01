import PQueue from 'p-queue';
import { shortObjHash, createChannel, promiseAllStrict } from '../util.js';
import { Item } from '../item/Item.js';
import { BaseExtractor } from './BaseExtractor.js';
import { DirectExtractor } from './DirectExtractor.js';
import { SelectorTransformer } from '../transform/index.js';
import * as prompts from './prompts.js';
import { getKV } from '../kv/index.js';

export const TransformExtractor = class extends BaseExtractor {
  constructor(options) {
    super(options);
    this.kv = options?.kv || getKV();
    this.seen = {};
    this.baseline = options?.baseline || new DirectExtractor(options);
  }

  async *_run(doc, questions, options) {
    this.logger.info(`${this} Extracting from ${doc} in ${this}: ${JSON.stringify(questions)}`);

    const transformer = new SelectorTransformer(questions, this);
    const r = await transformer.transform(doc.html, doc.url);

    if (this.signal?.aborted) {
      return;
    }

    if (!r) {
      this.logger.warn(`${this} Failed to transform, using baseline`);
      if (process.env.STRICT_ERRORS) {
        throw new Error('Failed to transform');
      }

      // Fallback to baseline
      const gen = this.baseline.run(doc, questions, options);
      for await (const r of gen) {
        yield Promise.resolve(r);
      }
      return;
    }

    const { htmls, selector, meta } = r;
    if (options.onArtifact) {
      options.onArtifact({ type: 'selector', data: { selector, meta } });
    }

    this.logger.debug(`${this} Running on ${htmls.length} html chunks`);

    const buffer = [];
    let idx = 0;
    htmls.forEach(() => { buffer.push(null) });

    const chan = createChannel();
    const q = new PQueue({ concurrency: 8 });
    const all = [];

    for (const [i, html] of htmls.entries()) {
      if (this.signal?.aborted) {
        break;
      }

      const num = i + 1;

      const h = shortObjHash({ html });
      if (this.seen[h]) {
        this.logger.debug(`${this} Drop repeat html for #${num}: ${h}`);
        buffer[i] = { _dupe: true };
        continue;
      }
      this.seen[h] = true;

      const task = q.add(async () => {
        if (this.signal?.aborted) {
          return;
        }

        this.logger.debug(`${this} Run on chunk #${num} of ${htmls.length}`);
        const item = await this._runSingle(doc, html, questions, options);
        chan.send({ index: i, item });
      });
      all.push(task);
    }

    const p = promiseAllStrict(all).then(() => chan.end());
    for await (const r of chan.receive()) {
      if (r.end) {
        break;
      }

      buffer[r.index] = r.item;
      while (buffer[idx]) {
        if (this.signal?.aborted) {
          break;
        }
        const item = buffer[idx++];
        if (item._dupe) {
          continue;
        }
        this.logger.debug(`${this} Yield from buffer ${idx - 1}`);
        yield Promise.resolve(new Item(item));
      }
    }

    await p;
  }

  async _runSingle(doc, html, questions) {
    const context = {
      url: doc.url,
      questions: JSON.stringify(questions, null, 2),
      body: html,
    };
    const { prompt } = await prompts.scrapeSingleShort.renderCapped(
      context, 'body', this.ai);
    const answer = await this.ai.ask(prompt, { format: 'json' });
    return new Item(answer?.partial || {}, doc);
  }
}
