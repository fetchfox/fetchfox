import { pageAction } from "./prompts.js";
import { logger } from "../log/logger.js";
import { TagRemovingMinimizer } from "../min/TagRemovingMinimizer.js";
import { getAI } from '../ai/index.js';
import { Timer } from "../log/timer.js";
import { getFetcher } from "../index.js";

export const PageAction = class {
  constructor(prompt, options) {
    this.prompt = prompt;
    this.ai = options?.ai || getAI();
  }

  async learn(url) {    
    const timer = new Timer();

    const fetcher = getFetcher();
    const doc = await fetcher.first(url);
    const min = new TagRemovingMinimizer(['style', 'script', 'meta', 'link']);
    const minDoc = await min.min(doc, { timer });

    const context = {
      html: minDoc.html,
      prompt: this.prompt
    }

    let prompts;
    try {
      prompts = await pageAction.renderMulti(context, 'html', this.ai);
    } catch (e) {
      logger.error(`${this} Error while rendering prompts: ${e}`);
      return;
    }

    logger.debug(`${this} analyze chunks for next action (${prompts.length})`);

    for (const prompt of prompts) {
      let answer;
      try {
        answer = await this.ai.ask(prompt, { format: 'json' });
      } catch(e) {
        logger.error(`${this} AI error, ignore: ${e}`);
        continue
      }

      logger.debug(`${this} Got an answer: ${JSON.stringify(answer.partial)}`);

      const commands = [];
      if (answer.partial?.actionCommand && answer.partial?.actionArgument) {
        commands.push({
          command: answer.partial.actionCommand,
          arg: answer.partial.actionArgument,
        });
      }

      return commands;
    }
  }
}