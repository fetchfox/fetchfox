import { logger } from "../log/logger.js";
import { BaseStep } from "./BaseStep.js";
import { Item } from "../item/Item.js";
import { FetchInstructions } from "../fetch/FetchInstructions.js";
import { PageAction } from "../fetch/PageAction.js";

export const PageActionStep = class extends BaseStep {
    constructor(args) {
        super(args);
        this.actions = args.actions;
        if (!this.actions || this.actions.length === 0) throw new Error('no actions');
    }

    async finish(cursor) {
        await cursor.ctx.fetcher.clear();
    }

    async process({ cursor, item, index }, cb) {
      const url = item.getUrl();
      const fetcher = cursor.ctx.fetcher;

      const options = {
        fetchOptions: { priority: index },
        url: url
      }

      const doc = await fetcher.first(url);
      const instructions = new FetchInstructions(doc, this.actions);
      
      try {
        for await (const fetchedDoc of fetcher.fetch(instructions, options)) {
          const done = cb(fetchedDoc);
          if (done) {
            break;
          }
        }
      } catch (e) {
        logger.error(`${this} Page Action error: ${e}`);
        throw e;
      }
    }
}