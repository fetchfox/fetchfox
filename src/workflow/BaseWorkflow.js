import { logger } from '../log/logger.js';
import { isPlainObject } from '../util.js';

export const BaseWorkflow = class {
  constructor() {
    this._stepsInput = [];
    this.steps = [];
  }

  dump() {
    const steps = [];
    for (const step of this.steps) {
      if (isPlainObject(step)) {
        steps.push(step);
      } else {
        steps.push(step.dump());
      }
    }

    let options;
    if (isPlainObject(this.ctx)) {
      options = JSON.parse(JSON.stringify(this.ctx));
    } else {
      options = this.ctx.dump();
    }

    return {
      steps,
      options,
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
        if (this.items.length) {
          logger.debug(`Stream sending to consume callback`);
          cb(this.items);
          this.items = [];
        } else {
          logger.debug(`Stream storing consume callback`);
          this.cb = cb;
        }
      },
    };

    const end = this.run(args, (r) => {
      if (r.item) {
        buffer.push(r.item);
      }
    })
      .then((out) => {
        done = true;
        return out.items;
      })
      .catch((e) => {
        logger.error(`${this} Error while running workflow: ${e}`);
        throw e;
      });

    const seen = [];

    while (!done) {
      const next = new Promise((ok) => {
        buffer.consume((r) => {
          ok(r);
        });
      });

      const result = await Promise.race([end, next]);

      for (const r of result) {
        if (seen[r._meta.id]) {
          continue;
        }
        seen[r._meta.id] = true;
        yield Promise.resolve({ item: r });
      }

      if (done) break;
    }

    logger.info(`${this} Streaming done`);
  }
};
