import { getFetcher } from "./index.js";
import { PageAction } from "./PageAction.js";
import { logger } from "../log/logger.js";

export const FetchInstructions = class {
  constructor(doc, actions, options) {
    this.doc = doc;
    this.actions = actions;
    if (!this.actions || this.actions.length === 0)
        throw new Error('no actions found');
    this.options = options;
  }

  async *fetch() {  
    for (const action of this.actions) {
      try  {
        const pageAction = new PageAction(action, this.options);
        const commands = await pageAction.learn(this.doc);

        for (const command of commands) {
          yield command;
        }
        // this.instructions.push(...commands);
      } catch (e) {
        logger.error(`${this} Error while fetching instructions ${e}`);
      }
    }
  }
}
