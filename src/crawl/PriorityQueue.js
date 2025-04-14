import { getAI } from '../ai/index.js'
import crypto from 'crypto';
import { norm } from './shared.js ';
import { shuffle } from '../util.js';
import * as prompts from './prompts.js';

export const PriorityQueue = class {
  constructor(scoreFn, options) {
    this.ai = options?.ai || getAI();

    this.list = [];
    this._seen = {};
    this.score = scoreFn;
  }

  get empty() {
    return this.list.length == 0;
  }

  seen(url) {
    return Boolean(this._seen[norm(url)]);
  }

  add(url) {
    if (this.seen(url)) {
      return;
    }
    const n = norm(url);
    this._seen[n] = true;
    this.list.push({ url });
    this._sorted = false;
  }

  sort() {
    const h = (v) => crypto
      .createHash('sha256')
      .update(JSON.stringify(v))
      .digest('hex');

    for (const x of this.list) {
      x.score = this.score(x.url);
    }

    this.list.sort((b, a) => {
      return a.score - b.score;

      const scoreA = this.score(a.url);
      const scoreB = this.score(b.url);

      // If they are the same, do deterministic random order
      if (scoreA == scoreA) {
        return h(a.url).localeCompare(h(b.url));
      }

      return scoreA - scoreB;
    });

    this._sorted = true;
  }

  shift() {
    this.sort();
    return this.list.shift();
  }

  get top() {
    if (!this._sorted) {
      this.sort();
    }
    return this.list[0];
  }

  async shiftMany(num, cutoff, goal, options) {
    this.sort();

    const onLink = options?.onLink ? options?.onLink : () => {};

    const results = [];
    // console.log('top score:', this.top?.score);
    while (results.length < num && this.top?.score > cutoff) {
      // console.log('-> top score:', this.top?.score);
      results.push(this.list.shift());
    }

    await new Promise(ok => setTimeout(ok, 3000));

    if (results.length == num) {
      return results;
    }

    if (results.length > num) {
      throw new Error('unxpected');
    }

    const remaining = num - results.length;
    const context = {
      num: remaining,
      urls: shuffle(this.list.map(it => it.url)).join('\n'),
      goal,
    };
    const { prompt } = await prompts.pqShift.renderCapped(context, 'urls', this.ai);
    const gen = this.ai.stream(prompt, { format: 'jsonl' });
    for await (const { delta } of gen) {
      if (this.list.filter(it => it.url == delta.url).length) {
        continue;
      }
      results.push(delta);
      onLink(delta);
    }

    // TODO: remove this filter
    this.list = this.list.filter(it => {
      return !results.some(jt => jt.url == it.url)
    });

    return results;
  }
}
