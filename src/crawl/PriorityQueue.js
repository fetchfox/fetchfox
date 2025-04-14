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
  }

  shift() {
    this.sort();
    return this.list.shift();
  }

  async shiftMany(num, cutoff, goal) {
    this.sort();

    // const onResult = options?.onResult ? options?.onResult : () => {};

    const results = [];
    while (results.length < num && this.list[0].score > cutoff) {
      results.push(this.list.shift());
    }

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

    console.log('prompt', prompt);

    const gen = this.ai.stream(prompt, { format: 'jsonl' });

    for await (const { delta } of gen) {
      console.log('pq delta', delta);
      results.push(delta);
    }

    console.log('list before', this.list);
    this.list = this.list.filter(it => {
      return !results.some(jt => jt.url == it.url)
    });
    console.log('list after ', this.list);

    return results;
  }
}
