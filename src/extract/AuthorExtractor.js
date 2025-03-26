import PQueue from 'p-queue';
import { createChannel, clip, promiseAllStrict } from '../util.js';
import { Item } from '../item/Item.js';
import { BaseExtractor } from './BaseExtractor.js';
import {
  PrettyTransformer,
  SelectorTransformer,
} from '../transform/index.js';
import * as prompts from './prompts.js';
import { getKV } from '../kv/index.js';
import { DirectExtractor } from './DirectExtractor.js';
import { Author, ExtractionTask } from '../author/index.js';

export const AuthorExtractor = class extends BaseExtractor {
  constructor(options) {
    super(options);
    this.kv = options?.kv || getKV();
    this.baseline = options?.baseline || new DirectExtractor(options);
  }

  async *_run(doc, questions) {
    this.logger.info(`${this} Extracting from ${doc} in ${this}: ${JSON.stringify(questions)}`);

    const url = doc.url;

    const namespace = new URL(url).host;
    const task = new ExtractionTask(namespace, questions, { extractor: this.baseline });

    const transformers = [];
    if (process.env.USE_TRANSFORM) {
      transformers.push(new PrettyTransformer(this));
      transformers.push(new SelectorTransformer(questions, this));
    }

    const author = new Author({
      fetcher: this.fetcher,
      kv: this.kv,
      ai: this.ai,
      cache: this.cache,
      logger: this.logger,
      transformers,
      timeout: this.timeout || 90 * 1000,
    });

    const urls = [url];
    if (doc.htmlUrl) {
      // It's likely the same data, but it's fast and we arleady have it,
      // and this helps with flakey fetches
      urls.push(doc.htmlUrl);
    }
    const gen = await author.run(task, urls);
    for await (const val of gen) {
      // Sometimes AI serializes the results in JSON
      if (typeof val.result == 'string') {
        try {
          val.result = JSON.parse(val.result);
        } catch {
          // no-op
        }
      }

      const list = Array.isArray(val.result) ? val.result : [val.result]
      this.logger.debug(`${this} Got ${list.length} results from author: ${clip(list, 200)}`);

      const chan = createChannel();

      // Handle any fields that need AI post-processing
      const q = new PQueue({ concurrency: 32 });
      const all = [];
      for (const item of list) {
        const task = q.add(async () => {
          const r = await this.aiProcess(item, questions);
          chan.send({ item: r });
        });
        all.push(task);
      }

      const p = promiseAllStrict(all).then(() => chan.end());

      for await (const r of chan.receive()) {
        if (r.end) {
          break;
        }
        yield Promise.resolve(new Item(r.item));
      }

      await p;
    }
  }

  async aiProcess(item, questions) {
    const aiItem = {};
    for (const [key, val] of Object.entries(item)) {
      if (val.ai) {
        aiItem[key] = `Give a value for ${key}="${questions[key]}" using this data: ${val.ai}`;
      }
    }

    if (!Object.keys(aiItem).length) {
      return item;
    }

    const context = {
      item: JSON.stringify(aiItem, null, 2),
    };
    const { prompt } = await prompts.aiProcess.renderCapped(context, 'item', this.ai);

    const answer = await this.ai.ask(prompt, { format: 'json' });
    this.logger.debug(`${this} AI processing gave: ${clip(JSON.stringify(answer.partial), 200)}`);

    return { ...item, ...answer.partial };
  }
}
