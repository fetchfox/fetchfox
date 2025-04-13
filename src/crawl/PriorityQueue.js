import { norm } from './shared.js ';

export const PriorityQueue = class {
  constructor() {
    this.list = [];
    this._seen = {};
  }

  get empty() {
    return this.list.length == 0;
  }

  seen(url) {
    return Boolean(this._seen[norm(url)]);
  }

  add(url, score) {
    if (this.seen(url)) {
      return;
    }
    const n = norm(url);
    this._seen[n] = true;
    this.list.push({ url: n, score: score || 1 });
  }

  shift() {
    this.list.sort((a, b) => b.score - a.score);
    return this.list.shift();
  }
}
