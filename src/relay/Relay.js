import ShortUniqueId from 'short-unique-id';

export const Relay = class {
  constructor() {
    this.subs = {};
  }

  listen(id, cb) {
    if (!this.subs[id]) {
      this.subs[id] = [];
    }
    this.subs[id].push(cb);
  }

  send(id, data) {
    if (!this.subs[id]) {
      return;
    }

    for (const cb of this.subs[id]) {
      cb(data);
    }
  }
};
