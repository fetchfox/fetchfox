import crypto from 'crypto';
import { norm } from './shared.js ';

export const PriorityQueue = class {
  constructor(scoreFn) {
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

  shift() {
    const h = (v) => crypto
      .createHash('sha256')
      .update(JSON.stringify(v))
      .digest('hex');

    this.list.sort((b, a) => {
      const scoreA = this.score(a.url);
      const scoreB = this.score(b.url);

      // If they are the same, do deterministic random order
      if (scoreA == scoreA) {
        return h(a).localeCompare(h(b));
      }

      return scoreA - scoreB;
    });

    // console.log('shift sorted:', this.list);
    return this.list.shift();
  }
}
