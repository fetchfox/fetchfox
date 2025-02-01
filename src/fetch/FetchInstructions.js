import { getFetcher } from "./index.js";
import { TagRemovingMinimizer } from "../min/TagRemovingMinimizer.js";
import { logger } from "../log/logger.js";
import { Timer } from "../log/timer.js";
import { getAI } from '../ai/index.js';
import * as prompts from './prompts.js';

export const FetchInstructions = class {
  constructor(url, prompts_, options) {
    this.url = url;
    this.prompts = prompts_;
    this.ai = options?.ai || getAI();

    // if (!this.prompts || this.prompts.length == 0) {
    //   throw new Error('no prompts');
    // }
    // this.options = options;
  }

  // Receives a Playwright page
  async learn(fetcher) {
    const learned = [];
    console.log('fi learn', this.url, this.prompts);
    const actions = [];

    const min = new TagRemovingMinimizer(['style', 'script', 'meta', 'link']);

    // TODO: refactor how fetcher works
    const timer = new Timer();
    let ctx = {};
    await fetcher.start(ctx);
    ctx = { ...ctx, ...(await fetcher.goto(this.url, ctx)) };
    // let doc = await fetcher.current(ctx);
    // let minDoc = await min.min(doc, { timer });
    // end TODO

    // const history = [];

    let doc;
    let minDoc;

    for (const prompt of this.prompts) {
      doc = await fetcher.current(ctx);
      minDoc = await min.min(doc, { timer });

      console.log('learn how to do', prompt);

      // Try to learn how to do `prompt` on the current page
      const context = {
        html: minDoc.html,
        prompt,
        // history: JSON.stringify(history, null, 2),
      };
      const { prompt: actionPrompt } = await prompts.pageAction
        .renderCapped(context, 'html', this.ai);

      // const answer = await 
      // console.log('answer', answer.partial.result);

      const stream = this.ai.stream(actionPrompt, { format: 'jsonl' });
      for await (const { delta } of stream) {
        console.log('delta', delta);
        const action = {
          type: delta.actionType,
          arg: delta.actionArgument,
        };

        learned.push(action);

        console.log('act ->', action);
        await fetcher.act(ctx, action, 0);
      }
    }

    this.learned = learned;

    console.log('learned actions:');
    console.log(JSON.stringify(this.learned, null, 2));

    await fetcher.finish(ctx);
  }
}
