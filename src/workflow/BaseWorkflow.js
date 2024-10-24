import { stepNames } from '../step/info.js';

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
    return { steps };
  }

  context() {
    if (!this.ctx) this.config({});
    return this.ctx;
  }

  load(data) {
    this.steps = [];
    for (const step of data.steps) {
      this.step(step);
    }
    return this;
  }

  step(data) {
    this._stepsInput.push(data);
    return this;
  }

  init(prompt) {
    return this.step(JSON.stringify({ name: 'const', prompt }));
  }

  parseRunArgs(args) {
    if (typeof args == 'string') {
      this._stepsInput.push(args);
    } else if (Array.isArray(args)) {
      this._stepsInput = [...this._stepsInput, ...args];
    }
  }
}
