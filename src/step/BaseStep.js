import { logger } from '../log/logger.js';

export const BaseStep = class {
  static combineInfo = (info) => {
    const combined = {...info};
    combined.args.limit = {
      description: 'Limit the number of results in this step.',
      format: 'number',
      example: 5,
      required: false,
    };
    return combined;
  };

  constructor(args) {
    this.limit = args?.limit;
    this.callbacks = {};
  }

  toString() {
    return `[${this.constructor.name}]`;
  }

  args(a) {
    const info = this.constructor.info;
    const args = {};
    for (const key of Object.keys(info.args)) {
      args[key] = this[key];
    }
    return args;
  }

  dump() {
    return {
      name: this.constructor.info.name,
      args: this.args(),
    };
  }

  async _before(cursor, index) {
    this.results = [];

    if (this.before) {
      return this.before(cursor);
    }
  }

  async _finish(cursor, index) {
    try {
      // if (!buffer || buffer.length == 0) {
      //   return;
      // }

      if (!this.finish) {
        return;
      }

      const out = await this.finish();

      const key = `Step${index + 1}_${this.constructor.name}`;
      for (let i = 0; i < out.length && i < this.results.length; i++) {
        const item = this.results[i];
        item[key] = out[i];
      }

    } finally {
      cursor.finish(index);
    }
  }

  on(event, cb) {
    if (!['item', 'done'].includes(event)) {
      throw new Error(`Unhandled event ${event}`);
    }
    this.callbacks[event] ||= [];
    this.callbacks[event].push(cb);
  }

  trigger(event, item) {
    if (!['item', 'done'].includes(event)) {
      throw new Error(`Unhandled event ${event}`);
    }

    const cbs = this.callbacks[event] || [];
    cbs.map(cb => cb(item));
  }

  remove(rm) {
    for (const key of Object.keys(this.callbacks)) {
      this.callbacks[key] = this.callbacks[key].filter(cb => cb != rm);
    }
  }

  // publish(item) {
  //   this.results.push(item);
  //   const done = this.limit && this.results.length >= this.limit;
  //   for (const cb of (this.callbacks.item || [])) {
  //     cb(item);
  //   }
  //   return done;
  // }

  async run(cursor, upstream, index) {
    console.log('run()');

    await this._before();

    const parent = upstream[upstream.length - 1];
    const rest = upstream.slice(0, upstream.length - 1);

    let onParentDone;
    let onParentItem;

    let parentDone = false;
    let received = 0;
    let completed = 0;

    // The following promise resolves on one of two conditions:
    // 1) Hit output limit on the current step
    // 2) Parent is done, and all its outputs are completed
    await new Promise(async (ok) => {
      console.log('in promise', ok);

      onParentDone = parent.on('done', async () => {
        console.log('got parent done event, stats:', received);
        parentDone = true;
        // ok();
      });

      onParentItem = parent.on('item', async (item) => {
        received++;
        console.log('got ITEM event, stats:', received, completed);
        await this.process(
          cursor,
          item,
          (output) => {
            this.results.push(output);
            this.trigger('item', output);

            const hitLimit = this.limit && this.results.length >= this.limit;
            const done = hitLimit;

            if (done) {
              console.log('DONE! in: ' + this);
              ok();
            }

            return done;
          });

        completed++;
        console.log('finished item, stats:', received, completed, parentDone);

        if (parentDone && received == completed) {
          ok();
        }

      });

      console.log('set up cb', onParentItem);

      await parent.run(cursor, rest, index);
    });

    await this._finish(cursor, index);
    parent.remove(onParentItem);
    parent.remove(onParentDone);

    this.trigger('done');

    return this.results;

    // let onMe;
    // let onParentDone;
    // let parentDone = false;
    // onMe = this.on('item', (item) => {
    //   return cursor.publish(item, index);
    // });

      // let inflight = 0;
      // onParentDone = parent.on('done', async (item) => {
      //   console.log('parent done cb');
      // });

        // console.log(`----> process item in ${this}`);
        // inflight++;
        // const hitLimit = await this.process(cursor, item, index);
        // console.log(`:::::: GOT DONE value ${done} from in ${this}`);
        // inflight--;
        // console.log(`an item completed in ${this}, still inflight: ${inflight}`);
        // console.log(`---> now have ${this.results.length} results in ${this}, limit is ${this.limit}`);
        // done && doneCb && doneCb();
        // if (this.results.length >= this.limit) {
        //   ok();
        // }
      // });


        // () => {
        //   console.log('===> DONE CB in ' + this);
        //   // parentDone = true;
        //   // ok('OK DUE TO ');
        // }
    //   );
    // });

    // console.log('DO FINISH in step ' + this);


    // this.remove(onMe);
    // parent.remove(onParentDone);
    // console.log('FINISHED WITH step ' + this, this.results);

  }

  // async *pipe(cursor, inputs, index) {
  //   try {
  //     for await (const r of this._pipe(cursor, inputs, index)) {
  //       yield Promise.resolve(r);
  //     }
  //   } catch(e) {
  //     cursor.error(e.toString(), index);
  //   }
  // }

  // async *_pipe(cursor, inputs, index) {
  //   let buffer;
  //   if (this.finish) {
  //     buffer = [];
  //   }

  //   const complete = (item) => {
  //     cursor.publish(item, index);
  //     return Promise.resolve(item);
  //   }

  //   try {
  //     await this._before(cursor, index);

  //     for await (const item of inputs) {
  //       cursor.didStart(index);

  //       for await (const output of this.runItem(cursor, item)) {
  //         if (buffer) {
  //           buffer.push(output);
  //         } else {
  //           yield complete(output);
  //         }
  //       }
  //     }
  //   } catch(e) {
  //     if (e.code != 'limit') {
  //       throw e;
  //     }
  //   } finally {
  //     const finished = await this._finish(cursor, index, buffer);
  //     for (const output of (finished || [])) {
  //       yield complete(output);
  //     }
  //   }
  // }
}
