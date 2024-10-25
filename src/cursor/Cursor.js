import { Context } from '../context/Context.js';
import { Item } from '../item/Item.js';

export const Cursor = class {
  constructor(args, steps, cb) {
    this.ctx = new Context(args);
    this.cb = cb ? cb : () => {};
    this.full = [];
    this.results = [];
    steps.map((step) => this.full.push({
      items: [],
      step: step.dump(),
    }));
  }

  didStart(stepIndex) {
    this.full[stepIndex].loading = true;
    this.full[stepIndex].didStart = true;
    this.full[stepIndex].done = false;
  }

  publish(item, stepIndex) {
    let copy;
    if (item instanceof Item) {
      copy = item.copy();
    } else {
      copy = JSON.parse(JSON.stringify(item));
    }

    this.full[stepIndex].items.push(copy);
    if (this.cb && stepIndex == this.full.length - 1) {
      this.results = this.full[stepIndex].items;
      this.cb({
        item,
        stepIndex,
        results: this.results,
        full: this.full,
      });
    }
  }

  error(message, stepIndex) {
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
  }
}
