// import fetch from 'node-fetch';
import WebSocket from 'ws';
import { logger } from '../log/logger.js';
import { BaseStep } from '../step/BaseStep.js';
import { BaseWorkflow } from './BaseWorkflow.js';
import { stepNames } from '../step/index.js';

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

  ws() {
    const wsUrl = this.host().replace(/^http/, 'ws');
    return new WebSocket(wsUrl);
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

  async plan(...args) {
    throw 'TODO';
  }

  async run(args, cb) {
    const url = this.host().replace(/^http/, 'ws');
    const ws = new WebSocket(url);

    return new Promise((ok, err) => {
      ws.on('open', () => {
        console.log('OPEN');
        const message = JSON.stringify({
          command: 'run',
          context: this.ctx,
          workflow: {
            steps: this.steps,
          }
        });
        ws.send(message);
      });

      ws.on('message', (msg) => {
        const data = JSON.parse(msg);
        logger.debug(`Client side websocket message: ${data}`);
        cb(data);
      });

      ws.on('error', (e) => {
        logger.error(`Client side websocket error: ${e}`);
        err(e);
      });

      ws.on('close', () => {
        logger.info('Client side websocket connection closed');
        ok();
      });
    });
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
