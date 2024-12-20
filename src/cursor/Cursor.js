import { logger } from '../log/logger.js';
import { Context } from '../context/Context.js';
import { Item } from '../item/Item.js';

export const Cursor = class {
  constructor(args, steps, cb) {
    this.ctx = new Context(args);
    this.cb = cb ? cb : () => {};
    this.full = [];
    this.items = [];
    this.deferCb = [];
    steps.map((step) =>
      this.full.push({
        items: [],
        step: step.dump(),
      }),
    );

    this._itemMap = {};
    this._nextId = 1;
  }

  out(markDone) {
    const out = JSON.parse(
      JSON.stringify({
        done: this.done,
        items: this.items.filter((it) => it._meta?.status != 'loading'),
        full: this.full,
        context: this.ctx.dump(),
      }),
    );

    if (markDone) {
      for (const step of out.full) {
        delete step.loading;
        if (!step.done) {
          step.forcedDone = true;
          step.done = true;
        }
      }
    }

    return out;
  }

  didStart(stepIndex) {
    this.full[stepIndex].loading = true;
    this.full[stepIndex].didStart = true;
    this.full[stepIndex].done = false;
    this.full[stepIndex].items = [];

    if (this.ctx.publishAllSteps) {
      this.cb(this.out());
    }
  }

  publish(id, item, stepIndex, done) {
    if (id) {
      // Got id, update
      if (!this._itemMap[id]) {
        throw new Error(`${this} Tried to publish item with id ${id}, not found`);
      }
      for (const key of Object.keys(item)) {
        this._itemMap[id][key] = item[key];
      }
    } else {
      // No id, create
      let copy;
      if (item instanceof Item) {
        copy = item.copy();
      } else {
        copy = JSON.parse(JSON.stringify(item));
      }
      id = this._nextId++;
      this._itemMap[id] = copy;
      this.full[stepIndex].items.push(copy);
    }

    if (done) {
      this.full[stepIndex].done = true;
      delete this.full[stepIndex].loading;
    }

    const isLast = stepIndex == this.full.length - 1;
    if (isLast) {
      this.items = this.full[stepIndex].items;
    }

    const shouldPublish = (isLast && item._meta?.status == 'done') || this.ctx.publishAllSteps;

    if (this.cb && shouldPublish) {
      this.cb({
        ...this.out(),
        item,
        stepIndex,
      });
    }

    return id;
  }

  error(message, stepIndex) {
    message = '' + message;
    this.full[stepIndex].error = message;
    this.full[stepIndex].done = true;
    delete this.full[stepIndex].loading;
    return (
      this.cb &&
      this.cb({
        ...this.out(),
        stepIndex,
        error: { index: stepIndex, message },
      })
    );
  }

  finish(stepIndex) {
    logger.info(`Finish step ${stepIndex} in cursor`);

    this.full[stepIndex].done = true;
    delete this.full[stepIndex].loading;
    if (this.ctx.publishAllSteps) {
      this.cb(this.out());
    }
  }

  defer(cb) {
    this.deferCb.push(cb);
  }

  finishAll() {
    logger.info(`Finish all in cursor`);
    for (let i = 0; i < this.full.length; i++) {
      if (!this.full[i].done) {
        this.finish(i);
        this.full[i].forcedDone = true;
      }
    }

    for (const cb of this.deferCb) {
      cb();
    }
  }
};
