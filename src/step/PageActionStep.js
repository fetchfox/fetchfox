import { logger } from "../log/logger.js";
import { BaseStep } from "./BaseStep.js";
import { Item } from "../item/Item.js";
import { FetchInstructions } from "../fetch/FetchInstructions.js";
import { PageAction } from "../fetch/PageAction.js";

export const PageActionStep = class extends BaseStep {
    constructor(args) {
        super(args);

        this.actions = args.actions;
        if (!actions || this.actions.length === 0) throw new Error('no actions');
    }

    async finish(cursor) {
        await cursor.ctx.fetcher.clear();
    }

    async process({ cursor, item, index }, cb) {
      const url = item.getUrl();
      const fetcher = cursor.ctx.fetcher;

      const options = {
        fetchOptions: { priority: index }
      }

      // actions = this.prompts.map((prompt) => new PageAction(prompt).learn(url));
      const instructions = new FetchInstructions(url, this.actions, options);
    
      try {
        for await (const doc of fetcher.stream(instructions, options)) {
          const done = cb(new Item(), doc);
          if (done)
            break;
        }
      } catch (e) {
        logger.error(`${this} Got error: ${e}`);
        throw e;
      }
    }
}