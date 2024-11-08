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
    const job = await this.kv.get(id);
    if (this.subs[id]) {
      for (const cb of this.subs[id]) {
        cb(job);
      }
    }
  }

  async pub(id, results) {
    await this.kv.set(id, results);
    this.trigger(id);
  }

  async finish(id, results) {
    const job = results || {};
    job.done = true;
    await this.kv.set(id, job);

    this.trigger(id);

    delete this.subs[id];
  }
}
