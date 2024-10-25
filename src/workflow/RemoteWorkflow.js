// import fetch from 'node-fetch';
import { BaseStep } from '../step/BaseStep.js';
import { BaseWorkflow } from './BaseWorkflow.js';

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

  load(data) {
    this.steps = [];
    for (const step of data.steps) {
      this.step(step);
    }
    return this;
  }

  async plan(...args) {
    if (args) this.parseRunArgs(args);
    const url = this.url('/plan');
    console.log('plan url:', url);

    console.log('');
    console.log('');
    console.log('this.steps:      ', this.steps);
    console.log('');
    console.log('');
    console.log('this._stepsInput:', this._stepsInput);
    console.log('');
    console.log('');

    const stepStrs = []; //[...this.steps, ...this._stepsInput];

    for (const input of this._stepsInput) {
      if (input instanceof BaseStep) {
        stepStrs.push(input.dump());
      } else {
        stepStrs.push(input);
      }
    }

    const resp = await fetch(
      url,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stepStrs),
      });
    const data = await resp.json();
    console.log('response', data);
    return data;
  }
}
