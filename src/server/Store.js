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
    if (this.subs[id]) {
      const subs = this.subs[id];  // Store subs before async call
      const job = await this.kv.get(id);
      for (const cb of subs) {
        cb(job);
      }
    }
  }

  async pub(id, results) {
    const updatedAt = Math.floor((new Date()).getTime() / 1000);
    await this.kv.set(id, { ...results, updatedAt });
    this.trigger(id);
  }

  async finish(id, results) {
    const finishedAt = Math.floor((new Date()).getTime() / 1000);
    const job = results || (await this.kv.get(id)) || {};
    job.done = true;
    job.finishedAt = finishedAt;
    await this.kv.set(id, job);

    await this.trigger(id);

    delete this.subs[id];
  }
}
