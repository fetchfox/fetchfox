import { logger } from '../log/logger.js';
import { getAI, getCrawler, getFetcher, getExtractor, getExporter } from '../index.js';
import { stepDescriptions, classMap, BaseStep } from '../step/index.js';
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

  async planArray(stepsInput) {
    const stepsJson = [];

    const stringify = (input) => {
      if (typeof input == 'string') {
        return input;
      } else if (input instanceof BaseStep) {
        return JSON.stringify(input.dump());
      } else {
        return JSON.stringify(input);
      }
    }

    let allSteps = '';
    for (let i = 0; i < stepsInput.length; i++) {
      allSteps += `${i + 1}) ${stringify(stepsInput[i])}\n`
    }

    for (const input of stepsInput) {
      const str = stringify(input);
      const stepLibrary = stepDescriptions.map(v => JSON.stringify(v, null, 2)).join('\n\n');
      const context = {
        stepLibrary,
        allSteps,
        step: str,
      }
      const prompt = singleStep.render(context);
      const answer = await this.ai.ask(prompt, { format: 'json' });
      logger.verbose(`Step planned "${str}" into ${JSON.stringify(answer.partial)}`);
      stepsJson.push(answer.partial);
    }

    return stepsJson.map(x => this.fromJson(x));
  }

  async planString(allSteps) {
    const stepLibrary = stepDescriptions.map(v => JSON.stringify(v, null, 2)).join('\n\n');
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
    logger.verbose(`Plann from JSON: ${JSON.stringify(json)}`);
    const cls = classMap[json.name];
    const args = Object.assign({}, json.args);
    return new cls(args);
  }
}
