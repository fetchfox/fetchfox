import { getFetcher, getAI, DiskCache } from '../index.js';
import * as prompts from './prompts.js';

let cache = new DiskCache('/tmp/ff-cache', { ttls: { base: 1e50 } });
// cache = null;

export class Planner {
  constructor(options) {
    this.fetcher = options?.fetcher || getFetcher(null, { cache });
    this.ai = options?.ai || getAI(null, { cache });
  }

  async plan({ url, prompt, kb, ...rest }) {
    console.log('plan', url, prompt);
    const context = {
      url,
      prompt,
      kb: JSON.stringify(kb, null, 2),
    };
    const { prompt: planPrompt } = await prompts
      .plan3
      .renderCapped(context, 'kb', this.ai);
    
    const answer = await this.ai.ask(planPrompt, { format: 'json' });
    const steps = answer.partial;

    // const stream = this.ai.stream(planPrompt, { format: 'jsonl' });
    // const steps = [];
    // for await (const { delta } of stream) {
    //   console.log('plan step ->', delta);
    //   steps.push(delta);
    // }
    return steps;
  }
}
