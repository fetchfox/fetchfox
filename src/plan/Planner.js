import { logger } from '../log/logger.js';
import { getAI, getCrawler, getFetcher, getExtractor, getExporter } from '../index.js';
import { stepDescriptions , classMap, BaseStep } from '../step/index.js';
import { singleStep, combined } from './prompts.js';
import { isPlainObject } from '../util.js';

export const Planner = class {
  constructor(options) {
    const cache = options?.cache;
    this.ai = options?.ai || getAI(null, { cache });
    this.user = options.user;
  }

  async plan(...args) {
    if (args.length == 1) {
      return this.planString(args[0]);
    } else {
      return this.planArray(args);
    }
  }

  async planArray(stepsInput) {
    const objs = [];
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
      if (input instanceof BaseStep) {
        logger.debug(`Planner pushing ${input} into steps`);
        objs.push(input);
      } else if (isPlainObject(input) && input.name) {
        logger.debug(`Planner parsing JSON input ${JSON.stringify(input)} into steps`);
        objs.push(this.fromJson(input));
      } else {
        const str = stringify(input);
        const stepLibrary = stepDescriptions
          .filter(v => !v.hideFromAI)
          .map(v => JSON.stringify(v, null, 2)).join('\n\n');
        const context = {
          stepLibrary,
          allSteps,
          step: str,
        }
        if (this.user) {
          context.user = userPrompt(this.user);
        }
        const prompt = singleStep.render(context);
        const answer = await this.ai.ask(prompt, { format: 'json' });
        logger.debug(`Step planned "${str}" into ${JSON.stringify(answer.partial)}`);
        objs.push(this.fromJson(answer.partial));
      }
    }

    return objs;
  }

  async planString(allSteps) {
    const stepLibrary = stepDescriptions.map(v => JSON.stringify(v, null, 2)).join('\n\n');
    const context = {
      stepLibrary,
      allSteps,
    };
    if (this.user) {
      context.user = userPrompt(this.user);
    }
    const prompt = combined.render(context);
    const answer = await this.ai.ask(prompt, { format: 'json' });
    const stepsJson = answer.partial;
    return stepsJson.map(x => this.fromJson(x));
  }

  fromJson(json) {
    logger.debug(`Plan from JSON: ${JSON.stringify(json)}`);
    const cls = classMap[json.name];
    const args = Object.assign({}, json.args);
    if (!cls) {
      throw new Error(`Planner got invalid JSON: ${JSON.stringify(json)}`);
    }
    return new cls(args);
  }
}

const userPrompt = (user) => `The user executing this prompt is below.
- For export steps, take into account the users available platforms and folders on those platforms
- UNLESS there is GOOD CLEAR MATCH, use the top level "/" folder
${JSON.stringify(user, null, 2)}`;
