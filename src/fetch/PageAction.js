import { pageAction } from "./prompts.js";
import { logger } from "../log/logger.js";
import { TagRemovingMinimizer } from "../min/TagRemovingMinimizer.js";
import { getAI } from '../ai/index.js';
import { Timer } from "../log/timer.js";

export const PageAction = class {
  constructor(namespace, prompt) {
    this.namespace = namespace;
    this.prompt = prompt;
    this.ai = getAI()
  }

  async learn(examples) {

  }

  async execute(page) {
    const timer = new Timer();
    const url = page.url;
    const doc = await page.content();
    // const min = new TagRemovingMinimizer(['style', 'script', 'meta', 'link']);
    // const minDoc = await min.min(doc, { timer });
    const context = {
      html: doc,
      prompt: this.prompt
    }

    let prompts;
    try {
      prompts = await pageAction.renderMulti(context, 'html', this.ai);
    } catch (e) {
      logger.error(`${this} Error while rendering prompts: ${e}`);
      return;
    }

    const commands = [];
    logger.debug(`${this} analyze chunks for next action (${prompts.length})`);

    for (const prompt of prompts) {
      let answer;
      try {
        answer = await this.ai.ask(prompt, { format: 'json' });
      } catch(e) {
        logger.error(`${this} Got AI error during pagination, ignore: ${e}`);
        continue
      }

      logger.debug(`${this} Got pagination answer: ${JSON.stringify(answer.partial)}`);

      if (answer.partial?.actionCommand && answer.partial?.actionArgument) {
        commands.push({
          command: answer.partial.actionCommand,
          arg: answer.partial.actionArgument,
        });
      }
    }

    logger.debug(commands);

    let index = 0;
    while (index < commands.length) {
      const { command, arg } = commands[index];
      logger.info(`${this} Taking action: ${command} ${arg}, index=${index}}`);
      if (Array.isArray(arg) && arg.length > 0) {
        for (let i = 0; i < arg.length; i++) {
          try {
            switch (command) {
              case 'click':
                await this.click(arg[i], page);
                await page.goBack();
                break;
              case 'scroll':
                await this.scroll(arg[i], page);
                break;
              default:
                logger.error(`${this} Unhandled command: ${command} ${arg[i]}`);
                break;
            }
          } catch (e) {
            logger.error(`${this} Error while executing action ${command} ${arg[i]}, ignoring: ${e}`);
          }
        }
      } else {
        try {
          switch (command) {
            case 'click':
              await this.click(arg, page);
              break;
            case 'scroll':
              await this.scroll(arg, page);
              break;
            default:
              logger.error(`${this} Unhandled command: ${command} ${arg}`);
              break;
          }
        } catch (e) {
          logger.error(`${this} Error while executing action ${command} ${arg}, ignoring: ${e}`);
        }
      }
      index++;
    }
  }

  async click(selector, page) {
    if (!selector.startsWith('text=') && !selector.startsWith('css=')) {
      logger.warn(`{this} Invalid selector: ${selector}`);
      return;
    }

    const loc = page.locator(selector);
    if (!await loc.count()) {
      logger.warn(`${this} Couldn't find selector=${selector}, not clicking`);
      return;
    }

    const el = loc.first();
    await el.scrollIntoViewIfNeeded();
    return el.click();
  }

  async scroll(type, page) {
    switch (type) {
      case 'window':
        return page.keyboard.press('PageDown');
      case 'bottom':
        /* eslint-disable no-undef */
        return page.evaluate(() => window.scrollBy(0, window.innerHeight));
        /* eslint-enable no-undef */
      default:
        logger.error(`${this} Unhandled scroll type: ${type}`);
    }
  }
}