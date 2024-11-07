import { getAI } from '../ai/index.js';

export const BaseVision = class {
  constructor(options) {
    this.ai = options?.ai || getAI();
  }
}
