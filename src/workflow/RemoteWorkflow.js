import { logger } from '../log/logger.js';
import { BaseStep } from '../step/BaseStep.js';
import { BaseWorkflow } from './BaseWorkflow.js';
import { stepNames } from '../step/info.js';

export const RemoteWorkflow = class extends BaseWorkflow {
  config(args) {
    this.ctx = args;
    return this;
  }

  host() {
    return this.ctx?.host || 'http://127.0.0.1:9090';
  }

  url(endpoint) {
    return this.host() + endpoint;
  }

  init(prompt) {
    return this.step({ name: 'const', args: prompt });
  }

  step(data) {
    this.steps.push(data);
    return this;
  }

  load(data) {
    this.steps = [];
    for (const step of data.steps) {
      this.step(step);
    }
    return this;
  }

  async _initWs() {
    if (this.WebSocket) return;

    try {
      this.WebSocket = window.WebSocket;
    } catch(e) {
      const wsModule = await import('ws');
      this.WebSocket = wsModule.default;
    }
  }

  async ws(msg, cb) {
    await this._initWs();

    const url = this.host().replace(/^http/, 'ws');
    logger.info(`Connect to ws: ${url}`);
    const ws = new this.WebSocket(url);

    return new Promise((ok, err) => {
      ws.onopen = () => {
        logger.info(`Websocket open, sending ${JSON.stringify(msg)}`);
        ws.send(JSON.stringify(msg));
      }

      ws.onmessage = (msg) => {
        const data = JSON.parse(msg.data);
        logger.debug(`Client side websocket message: ${JSON.stringify(data).substr(0, 120)}`);
        if (data.close) {
          ok(data.out);
          ws.close(1000);
        } else {
          cb && cb(data);
        }
      }

      ws.onerror = (e) => {
        logger.error(`Client side websocket error: ${e}`);
        err(e);
      }

      ws.onclose = () => {
        logger.info('Client side websocket connection closed');
      }

    });
  }

  async plan(...args) {
    return this.ws({
      command: 'plan',
      prompt: args,
    });
  }

  async sub(id, cb) {
    const out = await this.ws(
      { command: 'sub', id },
      cb);
    return out.items;
  }

  async run(args, cb) {
    if (args?.steps) {
      this.steps = args.steps;
    }

    console.log('====> RUN...');

    const id = await this.ws({
      command: 'run',
      context: this.ctx,
      workflow: { steps: this.steps },
    });

    console.log('run gave id:', id);

    const out = await this.ws(
      { command: 'sub', id },
      cb);

    console.log('SUB gave:', out);

    return out.items;
  }
}

for (const stepName of stepNames) {
  RemoteWorkflow.prototype[stepName] = function(prompt) {
    this.step({
      name: stepName,
      args: prompt,
    });
    return this;
  }
}
