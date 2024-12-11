import { logger } from '../log/logger.js';
import ShortUniqueId from 'short-unique-id';

export const Store = class {
  constructor(kv) {
    if (!kv) {
      this.data = {};
      kv = {
        get: (id) => this.data[id],
        set: (id, val) => { this.data[id] = val },
      };
    }
    this.kv = kv;
    this.subs = {};
    this.debounce = {};
  }

  toString() {
    return '[Store]';
  }

  nextId() {
    const id = 'job_' +(new ShortUniqueId({
      length: 10,
      dictionary: 'alphanum_lower',
    })).rnd();
    return id;
  }

  async sub(id, cb) {
    const job = await this.kv.get(id);
    if (job) {
      cb(job);
      if (job.done) return;
    }

    if (!this.subs[id]) {
      this.subs[id] = [];
    }
    this.subs[id].push(cb);
  }

  async unsub(id, cb) {
    if (!this.subs[id]) return;
    this.subs[id] = this.subs[id].filter(c => c != cb);
  }

  async _debounceExec(which, id, msec, fn) {
    if (!this.debounce[which]) {
      this.debounce[which] = {};
    }
    if (!this.debounce[which][id]) {
      this.debounce[which][id] = {
        q: Promise.resolve(),
        seq: 0,
      };
    }

    const db = this.debounce[which];
    db[id].seq++;
    const mySeq = db[id].seq;
    db[id].q.then(async () => {
      await new Promise(ok => setTimeout(ok, msec));
      if (mySeq != db[id].seq) {
        return Promise.resolve();
      } else {
        return await fn();
      }
    });

    return db[id].q;
  }

  async trigger(id, val) {
    const subs = this.subs[id];
    return this._debounceExec(
      'trigger',
      id,
      100,
      async () => {
        if (!subs) return;
        for (const cb of subs) {
          cb(val);
        }
      });
  }

  async _set(id, val) {
    return this._debounceExec(
      'set',
      id,
      100,
      () => this.kv.set(id, val));
  }

  async pub(id, results) {
    const updatedAt = Math.floor((new Date()).getTime() / 1000);
    logger.debug(`${this} Pub set ${id}`);
    const val = { ...results, updatedAt };
    await this._set(id, val);
    this.trigger(id, val);
  }

  async finish(id, results) {
    const finishedAt = Math.floor((new Date()).getTime() / 1000);
    const job = results || (await this.kv.get(id)) || {};
    job.done = true;
    job.finishedAt = finishedAt;

    logger.debug(`${this} Finish set ${id}`);
    await this._set(id, job);
    await this.trigger(id, job);
    delete this.subs[id];
  }
}
