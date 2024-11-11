import { logger } from '../log/logger.js';
import { BaseStep } from '../step/BaseStep.js';
import { BaseWorkflow } from './BaseWorkflow.js';
import { stepNames } from '../step/info.js';
import { getWebSocket } from '../util.js';

export const RemoteWorkflow = class extends BaseWorkflow {
  constructor() {
    super();
    this.ctx = {};
  }

  config(args) {
    this.ctx = { ...this.ctx, ...args };
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
    if (data?.options) {
      this.ctx = this.ctx = { ...this.ctx, ...data.options };
    }
    this.steps = [];
    for (const step of (data?.steps || [])) {
      this.step(step);
    }
    return this;
  }

  async ws(msg, cb) {
    const WebSocket = await getWebSocket();

    const url = this.host().replace(/^http/, 'ws');
    logger.debug(`Connect to ws: ${url}`);
    const ws = new WebSocket(url);

    return new Promise((ok, err) => {
      ws.onopen = () => {
        logger.info(`Websocket open, sending ${JSON.stringify(msg).substr(0, 120)}`);
        if (this.ctx.apiKey) {
          msg.apiKey = this.ctx.apiKey;
        }
        ws.send(JSON.stringify(msg));
      }

      ws.onmessage = (msg) => {
        const data = JSON.parse(msg.data);
        logger.debug(`Client side websocket message: ${JSON.stringify(data).substr(0, 120)}`);
        if (data.close) {
          ok(data.out);
          ws.close(1000);
        } else {
          cb && cb(data, ws);
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
    this.id = id || this.id;
    try {
      const out = await this.ws({ command: 'sub', id }, cb);
      return out;
    } finally {
      this.id = null;
    }
  }

  async stop(id) {
    this.id = id || this.id;
    const out = await this.ws({ command: 'stop', id: this.id });
    return out;
  }

  async start(args, cb) {
    if (args?.steps) {
      this.steps = args.steps;
    }
    if (args?.options) {
      this.ctx = this.ctx = { ...this.ctx, ...args.options };
    }
    this.id = await this.ws({
      command: 'start',
      context: this.ctx,
      workflow: { steps: this.steps },
    });
    return this.id;
  }

  async run(args, cb) {
    try {
      this.id = await this.start(args, cb);
      return await this.sub(this.id, cb);
    } finally {
      this.id = null;
    }
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
