import { logger } from '../log/logger.js';
import { getAI, getCrawler, getFetcher, getExtractor, getExporter } from '../index.js';
import { descriptions, classMap } from '../step/index.js';
import { singleStep, combined } from './prompts.js';

export const Planner = class {
  constructor(options) {
    const cache = options?.cache;
    this.ai = options?.ai || getAI(null, { cache });
  }

  async plan(...args) {
    if (args.length == 1) {
      return this.planString(args[0]);
    } else {
      return this.planArray(args);
    }
  }

  async planArray(stepStrs) {
    const stepsJson = [];
    for (const str of stepStrs) {
      const stepLibrary = descriptions.map(v => JSON.stringify(v, null, 2)).join('\n\n');
      const context = {
        stepLibrary,
        allSteps: '- ' + stepStrs.join('\n- '),
        step: str,
      }
      const prompt = singleStep.render(context);
      const answer = await this.ai.ask(prompt, { format: 'json' });
      logger.info(`Step planned "${str}" into ${JSON.stringify(answer.partial)}`);
      stepsJson.push(answer.partial);
    }

    return stepsJson.map(x => this.fromJson(x));
  }

  async planString(allSteps) {
    const stepLibrary = descriptions.map(v => JSON.stringify(v, null, 2)).join('\n\n');
    const context = {
      stepLibrary,
      allSteps,
    };
    const prompt = combined.render(context);
    const answer = await this.ai.ask(prompt, { format: 'json' });
    const stepsJson = answer.partial;
    return stepsJson.map(x => this.fromJson(x));
  }

  fromJson(json) {
    logger.info(`JSON: ${JSON.stringify(json)}`);
    const cls = classMap[json.name];
    const args = Object.assign({}, json.args);
    return new cls(args);
  }
}
