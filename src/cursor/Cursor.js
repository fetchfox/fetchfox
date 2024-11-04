import { logger } from '../log/logger.js';
import { Context } from '../context/Context.js';
import { Item } from '../item/Item.js';

export const Cursor = class {
  constructor(args, steps, cb) {
    this.ctx = new Context(args);

    console.log('cursor context:', this.ctx);

    this.cb = cb ? cb : () => {};
    this.full = [];
    this.items = [];
    steps.map((step) => this.full.push({
      items: [],
      step: step.dump(),
    }));
  }

  out(markDone) {
    const out = JSON.parse(JSON.stringify({
      items: this.items,
      full: this.full,
      context: this.ctx.dump(),
    }));

    if (markDone) {
      out.forcedDone = true;
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

  publish(item, stepIndex, done) {

    console.log('publish-->', item);

    let copy;
    if (item instanceof Item) {
      copy = item.copy();
    } else {
      copy = JSON.parse(JSON.stringify(item));
    }

    this.full[stepIndex].items.push(copy);

    if (done) {
      this.full[stepIndex].done = true;
      delete this.full[stepIndex].loading;
    }

    const isLast = stepIndex == this.full.length - 1;
    if (isLast) {
      this.items = this.full[stepIndex].items;
    }

    if (this.cb && (isLast || this.ctx.publishAllSteps)) {
      this.cb({
        ...this.out(),
        item,
        stepIndex,
      });
    }
  }

  error(message, stepIndex) {
    message = '' + message;
    this.full[stepIndex].error = message;
    this.full[stepIndex].done = true;
    delete this.full[stepIndex].loading;
    return this.cb && this.cb({
      ...this.out(),
      stepIndex,
      error: { index: stepIndex, message },
    });
  }

  finish(stepIndex) {
    this.full[stepIndex].done = true;
    delete this.full[stepIndex].loading;

    if (this.ctx.publishAllSteps) {
      this.cb(this.out());
    }
  }
}
