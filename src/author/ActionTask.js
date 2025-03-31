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
    // TODO: how to handle on per-goal basis
    return `It is expected that the goals were achieved properly`;
  }
}
