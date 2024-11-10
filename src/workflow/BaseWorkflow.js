import { logger } from '../log/logger.js';
import { stepNames } from '../step/info.js';
import { isPlainObject } from '../util.js';

export const BaseWorkflow = class {
  constructor() {
    this._stepsInput = [];
    this.steps = [];
  }

  dump() {
    const steps = [];
    for (const step of this.steps) {
      steps.push(step.dump());
    }
    return {
      steps,
      name: this.name,
      description: this.description,
    };
  }

  step(data) {
    this._stepsInput.push(data);
    return this;
  }

  init(prompt) {
    return this.step({ name: 'const', args: prompt });
  }

  parseRunArgs(args) {
    if (typeof args == 'string') {
      this._stepsInput.push(args);
    } else if (Array.isArray(args)) {
      this._stepsInput = [...this._stepsInput, ...args];
    } else {
      if (args.steps) {
        this._stepsInput = args.steps;
      }
      if (args.options) {
        this.ctx.update(args.options);
      }
    }
  }

  async *stream(args) {
    let done = false;

    const buffer = {
      items: [],
      cb: null,

      push: function (item) {
        logger.debug(`Stream buffer got ${item}`);
        if (this.cb) {
          logger.debug(`Stream buffer sending item to callback`);
          this.cb([item]);
          this.cb = null;
        } else {
          logger.debug(`Stream buffer pushing item for later`);
          this.items.push(item);
        }
      },
      consume: function (cb) {
        logger.debug(`Stream got consume callback`);
        if(this.items.length) {
          logger.debug(`Stream sending to consume callback`);
          cb(this.items);
          this.items = [];
        } else {
          logger.debug(`Stream storing consume callback`);
          this.cb = cb;
        }
      }
    };

    const end = new Promise((ok, err) => {
      this.run(
        args,
        (r) => {
          buffer.push(r);
        })
        .then((out) => { done = true; ok(out) })
        .catch(err);
    });

    while(!done) {
      const next = new Promise((ok) => {
        buffer.consume(r => ok(r));
      });

      const result = await Promise.race([
        end,
        next,
      ]);

      if (done) break;

      for (const r of result) {
        yield Promise.resolve(r);
      }
    }

    logger.info(`Streaming done`);
  }
}
