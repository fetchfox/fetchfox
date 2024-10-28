import ShortUniqueId from 'short-unique-id';

export const Store = class {
  constructor() {
    this.jobs = {};
    this.subs = {};
  }

  nextId() {
    console.log('??');
    const id = (new ShortUniqueId({
      length: 10,
      dictionary: 'alphanum_lower',
    })).rnd();
    console.log('??', id);
    return id;
  }

  async sub(id, cb) {
    console.log('subbed to', id);

    const job = this.jobs[id];
    if (job) {
      cb(job);
      if (job.done) return;
    }

    if (!this.subs[id]) {
      this.subs[id] = [];
    }
    this.subs[id].push(cb);

    // if (this.jobs[id]) {
    //   cb(this.jobs[id]);

    //   console.log('*-> subbed to existing', this.jobs[id]);
    //   console.log('*-> subbed to existing, done?', this.jobs[id].done);
    // }
  }

  async unsub(id, cb) {
    if (!this.subs[id]) return;
    this.subs[id] = this.subs[id].filter(c => c != cb);
  }

  async trigger(id) {
    console.log('trigger', id);

    if (this.subs[id]) {
      for (const cb of this.subs[id]) {
        cb(this.jobs[id]);
      }
    }
  }

  async pub(id, results) {
    console.log('pub:', id);
    this.jobs[id] = results;

    this.trigger(id);
  }

  async finish(id, items) {
    this.jobs[id].items = items;
    this.jobs[id].done = true;;

    console.log('FINISH store:', this.jobs[id]);

    this.trigger(id);

    delete this.subs[id];
  }
}
