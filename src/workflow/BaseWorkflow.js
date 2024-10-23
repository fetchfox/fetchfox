import { classMap, stepNames } from '../step/index.js';

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
      const cls = classMap[step.name];
      this.steps.push(new cls(step.args));
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

for (const stepName of stepNames) {
  BaseWorkflow.prototype[stepName] = function(prompt) {
    const name = stepName;
    const cls = classMap[name];

    if (name == 'extract') {
      // TODO: generalize + test this
      if (prompt.questions) {
        return this.step(new cls(prompt));
      } else if (Array.isArray(prompt) || isPlainObject(prompt)) {
        return this.step(new cls({ questions: prompt }));
      }
    } else if (name == 'crawl') {
      if (typeof prompt == 'string') {
        return this.step(new cls({ query: prompt }));
      }

      // if (prompt.limit) {
      //   return this.step(new cls(prompt));
      // } else if (typeof prompt == 'number') {
      //   return this.step(new cls({ limit: prompt }));
      // }
    } else if (name == 'limit') {
      if (prompt.limit) {
        return this.step(new cls(prompt));
      } else if (typeof prompt == 'number') {
        return this.step(new cls({ limit: prompt }));
      }
    }


    return this.step(JSON.stringify({ name, prompt }));
  }
}
