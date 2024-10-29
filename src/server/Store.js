import ShortUniqueId from 'short-unique-id';

export const Store = class {
  constructor() {
    this.jobs = {};
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
    const job = this.jobs[id];
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
      for (const cb of this.subs[id]) {
        cb(this.jobs[id]);
      }
    }
  }

  async pub(id, results) {
    this.jobs[id] = results;
    this.trigger(id);
  }

  async finish(id, results) {
    this.jobs[id] = results;
    this.jobs[id].done = true;

    this.trigger(id);

    delete this.subs[id];
  }
}
