import { shortObjHash } from '../util.js';
import { BaseTask } from './BaseTask.js';

export const ActionTask = class extends BaseTask {
  constructor(namespace, goals, options) {
    super(options);
    this.namespace = namespace;
    this._goals = goals;
  }

  get goals() {
    return this._goals;
  }

  get key() {
    const hash = shortObjHash({ goals: this.goals });
    return `action-task-${this.namespace}-${hash}`;
  }

  async expected() {
    return `It is expected that the following actions were performed properly:
>>> ${this.goals.join('\n\n>>> ')}`;
  }
}
