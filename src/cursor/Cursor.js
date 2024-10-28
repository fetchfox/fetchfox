import { Context } from '../context/Context.js';
import { Item } from '../item/Item.js';

export const Cursor = class {
  constructor(args, steps, cb) {
    this.ctx = new Context(args);
    this.cb = cb ? cb : () => {};
    this.full = [];
    this.items = [];
    steps.map((step) => this.full.push({
      items: [],
      step: step.dump(),
    }));
  }

  didStart(stepIndex) {
    this.full[stepIndex].loading = true;
    this.full[stepIndex].didStart = true;
    this.full[stepIndex].done = false;

    if (this.ctx.publishAllSteps) {
      this.cb({
        items: this.items,
        full: this.full,
      });
    }
  }

  publish(item, stepIndex, done) {
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
    if (this.cb && (isLast || this.ctx.publishAllSteps)) {
      this.items = this.full[stepIndex].items;
      this.cb({
        item,
        stepIndex,
        items: this.items,
        full: this.full,
      });
    }
  }

  error(message, stepIndex) {
    message = '' + message;
    this.full[stepIndex].error = message;
    this.full[stepIndex].done = true;
    delete this.full[stepIndex].loading;
    return this.cb && this.cb(
      {
        error: { index: stepIndex, message },
        full: this.full,
      },
      stepIndex);
  }

  finish(stepIndex) {
    this.full[stepIndex].done = true;
    delete this.full[stepIndex].loading;

    if (this.ctx.publishAllSteps) {
      this.cb({
        items: this.items,
        full: this.full,
      });
    }
  }
}
