import { logger } from '../log/logger.js';
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

  async stop() {
    logger.info(`Cursor stopping ${this.ctx.extractor}`);
    if (this.ctx.extractor) this.ctx.extractor.stop();

    logger.info(`Cursor stopping ${this.ctx.fetcher}`);
    if (this.ctx.fetcher) this.ctx.fetcher.stop();

    logger.info(`Cursor stopping ${this.ctx.crawler}`);
    if (this.ctx.crawler) this.ctx.crawler.stop();

    logger.info(`Cursor stopping ${this.ctx.ai}`);
    if (this.ctx.ai) this.ctx.ai.stop();
  }

  out() {
    return {
      items: this.items,
      full: this.full,
    }
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
