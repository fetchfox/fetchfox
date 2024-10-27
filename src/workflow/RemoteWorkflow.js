// import fetch from 'node-fetch';
import WebSocket from 'ws';
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
    // if (args) this.parseRunArgs(args);
    // const url = this.url('/plan');
    // const stepStrs = [];

    // for (const input of this._stepsInput) {
    //   if (input instanceof BaseStep) {
    //     stepStrs.push(input.dump());
    //   } else {
    //     stepStrs.push(input);
    //   }
    // }
    // const resp = await fetch(
    //   url,
    //   {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(stepStrs),
    //   });
    // const data = await resp.json();
    // console.log('plan response data:', data);
    // this.steps = data.steps;
    // this._stepsInput = [];
    // return this;
  }

  async run(args, cb) {
    // await this.plan(args);

    console.log('this._stepsInput', this._stepsInput);
    console.log('this.steps', this.steps);

    const url = this.host().replace(/^http/, 'ws');
    const ws = new WebSocket(url);

    return new Promise((ok, err) => {
      ws.on('open', () => {
        console.log('Connected to WebSocket server');
        const message = JSON.stringify({
          command: 'run',
          context: this.ctx,
          workflow: {
            steps: this.steps,
          }
        });
        console.log('Send message:', message);
        ws.send(message);
      });

      ws.on('message', (msg) => {
        // console.log('===>Received msg: ', msg);
        const data = JSON.parse(msg);
        // console.log('===>Received data:', data);
        cb(data);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        err(error);
      });

      ws.on('close', () => {
        console.log('WebSocket connection closed');
        ok();
      });
    });
  }
}

for (const stepName of stepNames) {
  RemoteWorkflow.prototype[stepName] = function(prompt) {
    console.log('===' + stepName + ' ' + JSON.stringify(prompt));
    this.step({
      name: stepName,
      args: prompt,
    });
    return this;
  }
}
