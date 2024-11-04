import { logger } from '../log/logger.js';
import { getAI, getCrawler, getFetcher, getExtractor, getExporter } from '../index.js';
import {
  stepDescriptions,
  classMap,
  BaseStep,
} from '../step/index.js';
import { singleStep, combined, prePlan, describe, guided } from './prompts.js';
import { isPlainObject } from '../util.js';

const stepLibrary = stepDescriptions
  .filter(v => !v.hideFromAI)
  .map(v => JSON.stringify(v, null, 2)).join('\n\n');

export const Planner = class {
  constructor(options) {
    const cache = options?.cache;
    this.ai = options?.ai || getAI(null, { cache });
    this.user = options?.user;
  }

  async describe({ steps }) {
    logger.debug(`Analyze steps ${JSON.stringify(steps).substr(0, 120)}`);
    const context = {
      job: JSON.stringify(steps, null, 2),
    };
    const prompt = describe.render(context);
    const answer = await this.ai.ask(prompt, { format: 'json' });
    logger.debug(`Analyze got answer ${JSON.stringify(answer.partial)}`);
    const { name, description } = answer.partial;
    return { name, description };
  }

  async plan(args) {
    if (args?.prompt !== undefined) {
      return this.fromPrompt(args.prompt, args);
    } else if (args.length == 1) {
      return this.planString(args[0]);
    } else {
      return this.planArray(args);
    }
  }

  async planArray(stepsInput) {
    logger.debug(`Plan from array: ${stepsInput}`);

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
        const context = {
          stepLibrary,
          allSteps,
          step: str,
        }
        if (this.user) {
          context.user = userPrompt(this.user);
        } else {
          context.user = '';
        }
        const prompt = singleStep.render(context);
        const answer = await this.ai.ask(prompt, { format: 'json' });
        logger.debug(`Step planned "${str}" into ${JSON.stringify(answer.partial)}`);
        objs.push(this.fromJson(answer.partial));
      }
    }

    return { steps: objs };
  }

  async planString(scrapePrompt) {
    logger.debug(`Plan from string: ${scrapePrompt}`);

    const context = {
      stepLibrary,
      prompt: scrapePrompt,
      url: '',
      html: ''
    };
    if (this.user) {
      context.user = userPrompt(this.user);
    } else {
      context.user = '';
    }
    const prompt = combined.render(context);

    const answer = await this.ai.ask(prompt, { format: 'json' });
    const stepsJson = answer.partial;

    return { steps: stepsJson.map(x => this.fromJson(x)) };
  }

  fromJson(json) {
    logger.debug(`Plan from JSON: ${JSON.stringify(json)}`);
    const cls = classMap[json.name];
    logger.debug(`Got JSON args: ${JSON.stringify(json.args)}`);

    if (json.name == 'limit') {
      const parsed = parseInt(json.args);
      if (!isNaN(parsed)) {
        json.args = { limit: parsed };
      }

    } else if (json.name == 'const') {
      let arr = [];
      let items;
      if (json.args.items) {
        items = json.args.items;
      } if (Array.isArray(json.args)) {
        arr = json.args;
      } else {
        arr = [json.args];
      }

      if (!items) {
        items = [];
        for (const a of arr) {
          if (typeof a == 'string') {
            items.push({ url: a });
          } else {
            items.push(a);
          }
        }
      }

      json.args = { items };
    }
    logger.debug(`Cleaned JSON args: ${JSON.stringify(json.args)}`);

    if (!cls) {
      throw new Error(`Planner got invalid JSON: ${JSON.stringify(json)}`);
    }
    return new cls(json.args);
  }

  async fromPrompt(scrapePrompt, args) {
    logger.debug(`Plan from prompt: prompt=${scrapePrompt} args=${JSON.stringify(args).substr(0, 120)}`);

    const prePlanContext = {
      stepLibrary,
      prompt: scrapePrompt,
      url: (args.url || '').substr(0, 200),
      html: (args.html || '').substr(0, Math.max(0, this.ai.maxTokens - 5000))
    };
    if (this.user) {
      prePlanContext.user = userPrompt(this.user);
    } else {
      prePlanContext.user = '';
    }

    const prePlanPrompt = prePlan.render(prePlanContext);
    const prePlanAnswer = (await this.ai.ask(prePlanPrompt, { format: 'json' })).partial;

    logger.debug(`Got pre plan answer:\n${JSON.stringify(prePlanAnswer, null, 2)}`);

    const guidedContext = {
      stepLibrary,
      prompt: scrapePrompt,
      intent: prePlanAnswer.intentAnalysis,
      itemDescription: prePlanAnswer.itemDescription,
      detailFields: '- ' + prePlanAnswer.detailFields.join('\n - '),
      shouldCrawl: (
        prePlanAnswer.scrapeType == 'multiPage' ? 'This scrape should crawl to find more URLs' : 'This scrape should NOT have a crawl step'),
      itemsPerPage: (prePlanAnswer.perPage == 'multiple' ? 'You are looking for MULTIPLE items in each extraction' : 'You are looking for a SINGLE item per page in extraction'),
      url: (args.url || '').substr(0, 200),
    };
    const guidedPrompt = guided.render(guidedContext);
    const guidedAnswer = (await this.ai.ask(guidedPrompt, { format: 'json' })).partial;

    logger.debug(`Guided plan answer: ${JSON.stringify(guidedAnswer, null, 2)}`);

    return {
      steps: guidedAnswer.map(x => this.fromJson(x)),
      itemDescription: prePlanAnswer.itemDescription,
    }
  }
}

const userPrompt = (user) => `The user executing this prompt is below.
- For export steps, take into account the users available platforms and folders on those platforms
- UNLESS there is GOOD CLEAR MATCH, use a new folder named "FetchFox Export"
${JSON.stringify(user, null, 2)}`;
