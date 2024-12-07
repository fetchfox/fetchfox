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

    // TODO: pul out reusable debounce function/component
    this.debounceSet = {};
    this.debounceTrigger = {};

    this.q = Promise.resolve();
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

  async trigger(id) {
    if (!this.debounceTrigger[id]) {
      this.debounceTrigger[id] = {
        q: Promise.resolve(),
        seq: 0,
      };
    }

    this.debounceTrigger[id].seq++;
    const mySeq = this.debounceTrigger[id].seq;

    this.debounceTrigger[id].q.then(async () => {
      await new Promise((ok) => setTimeout(ok, 100));

      if (mySeq != this.debounceTrigger[id].seq) {
        return Promise.resolve();

      } else {
        return new Promise(async (ok) => {
          if (this.subs[id]) {
            const subs = this.subs[id];  // Store subs before async call
            const job = await this.kv.get(id);
            for (const cb of subs) {
              cb(job);
            }
          }
          ok();
        });
      }
    });

    return this.debounceTrigger[id].q;
  }

  async _set(id, val) {
    if (!this.debounceSet[id]) {
      this.debounceSet[id] = {
        q: Promise.resolve(),
        seq: 0,
      };
    }

    this.debounceSet[id].seq++;
    const mySeq = this.debounceSet[id].seq;

    this.debounceSet[id].q.then(async () => {
      await new Promise(ok => setTimeout(ok, 100));

      if (mySeq != this.debounceSet[id].seq) {
        return Promise.resolve();

      } else {
        val.seq = mySeq;
        return await this.kv.set(id, val);
      }
    });

    return this.debounceSet[id].q;
  }

  async pub(id, results) {
    const updatedAt = Math.floor((new Date()).getTime() / 1000);
    logger.debug(`${this} Pub set ${id}`);
    await this._set(id, { ...results, updatedAt });
    this.trigger(id);
  }

  async finish(id, results) {
    const finishedAt = Math.floor((new Date()).getTime() / 1000);
    const job = results || (await this.kv.get(id)) || {};
    job.done = true;
    job.finishedAt = finishedAt;

    logger.debug(`${this} Finish set ${id}`);
    await this._set(id, job);
    await this.trigger(id);

    delete this.subs[id];
  }
}
