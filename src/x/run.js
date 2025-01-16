import { range, last } from 'radash';
import { shuffle as stableShuffle } from '../util.js';
import { getFetcher, getAI, DiskCache } from '../index.js';
import { Crawler } from '../crawl/Crawler.js';
import { SinglePromptExtractor } from '../extract/SinglePromptExtractor.js';
import { TagRemovingMinimizer } from '../min/TagRemovingMinimizer.js';
import * as prompts from './prompts.js';

let cache = new DiskCache('/tmp/ff-cache', { ttls: { base: 1e50 } });
// cache = null;

export class Runner {
  constructor(options) {
    this.fetcher = options?.fetcher || getFetcher(null, { cache });
    this.ai = options?.ai || getAI(null, { cache });
  }

  async run({ url, prompt, kb }) {
    let states = [
      {
        url,
        history: [{ start: url }],
      }
    ];

    const maxStates = 5;

    for (const i of range(0, 3)) {
      console.log(`\n\t== Iteration ${i} ==\n`);
      console.log(states);
      console.log('');

      // const state = states[0];

      const newStates = [];
      for (const state of states) {
        const step = await this.step({ state, prompt, kb });
        const result = await this.execute({ state, step });

        console.log('Step:', step);
        console.log('Gave items:', result.items?.length, (result.items || [])[0]);
        console.log('Gave new states:');
        // console.log(JSON.stringify(result.newStates, null, 2));
        newStates.push(...result.newStates);
      }

      console.log('newStates:');
      newStates.map(it => this.ppState(it));
      // console.log(JSON.stringify(newStates, null, 2));

      // Get some new states, removing once that have stopped
      states = stableShuffle(newStates)
        .filter(state => {
          const l = last(state.history, {}).executedStep;
          return !l.abort && !l.success;
        })
        .slice(0, maxStates);
    }
  }

  ppState(state) {
    console.log('');
    console.log('== State ==');
    let i = 0;
    for (const h of state.history) {
      i++;

      if (h.start) {
        console.log(`* ${i}) Start: ${h.start}`);
        continue;
      }

      console.log(`* ${i}) ${h.inputUrl} -> ${JSON.stringify({...h.executedStep, intent: null })}`);
      console.log(`     Intent: ${h.executedStep.intent}`);
      if (h.outcome.linksFound) {
        console.log(`     Found links: ${h.outcome.linksFound}`);
      }
      if (h.outcome.itemsFound) {
        console.log(`     Found items: ${h.outcome.itemsFound}`);
      }
    }
    console.log('');
  }

  // step figures out the next step for a given state
  async step({ state, prompt, kb }) {
    const { url, history } = state;
    console.log('determine step==>', url, prompt);
    const doc = await this.fetcher.first(url);
    const min = new TagRemovingMinimizer({ cache });
    const minDoc = await min.min(doc);
    const context = {
      url,
      text: minDoc.text,
      prompt,
      kb: JSON.stringify(kb, null, 2),
      steps: JSON.stringify(history, null, 2),
    };
    const { prompt: nextStepPrompt } = await prompts
      .nextStep
      .renderCapped(context, 'text', this.ai);
    // console.log(nextStepPrompt);
    console.log('send nextStepPrompt');
    const answer = await this.ai.ask(nextStepPrompt, { format: 'json' });
    console.log('answer==>', answer);
    const step = answer.partial;
    return step;
  }

  // execute does a step for a given state, and outputs one or more new states
  async execute({ state, step }) {
    const name = Object.keys(step).filter(k => k != 'intent')[0];
    const arg = step[name];

    const newStates = [];
    let urls;
    let items;

    // Execute the step
    switch (name) {
      case 'findLinks':
        urls = await this.findLinks(state.url, arg);
        break;

      case 'findLinksRegex':
        urls = await this.findLinksRegex(state.url, arg);
        break;

      case 'extractData':
        items = await this.extractData(state.url, arg);
        break;

      case 'success':
      case 'abort':
        console.log('!'.repeat(80));
        console.log(`!! got ${name}`);
        console.log('!'.repeat(80));
        break;

      default:
        throw new Error('unhandled: ' + name);
    }

    if (urls && items) {
      throw new Error('unexpected: got both items and urls');
    }

    // Generate new states based on step outcome

    if (urls) {
      // Generate new states from URLs found
      for (const url of urls) {
        const newState = JSON.parse(JSON.stringify(state));
        const historyStep = {
          inputUrl: state.url,
          executedStep: step,
          outcome: {
            linksFound: urls.length,
            sample: stableShuffle(urls).slice(0, 5),
          },
        };
        newState.history.push(historyStep);
        newState.url = url;
        newStates.push(newState);
      }

    } else if (items) {
      // Record history of finding items, no change in state URL
      const newState = JSON.parse(JSON.stringify(state));
      const historyStep = {
        inputUrl: state.url,
        executedStep: step,
        outcome: {
          itemsFound: items.length,
          sample: stableShuffle(items).slice(0, 5),
        },
      };
      newState.history.push(historyStep);
      newStates.push(newState);

    } else {
      // Record that nothing happened, no change in state
      const newState = JSON.parse(JSON.stringify(state));
      const historyStep = {
        inputUrl: state.url,
        executedStep: step,
        outcome: {},
      };
      newState.history.push(historyStep);
      newStates.push(newState);
    }

    return { items, urls, newStates };
  }

  async findLinks(url, prompt) {
    const crawler = new Crawler({ ai: this.ai, fetcher: this.fetcher });
    const urls = [];
    const limit = 30;
    for await (const item of crawler.run(url, prompt)) {
      if (item.url == url) {
        continue;
      }

      // console.log('find links found:', item);

      urls.push(item.url);

      if (urls.length == limit) {
        break;
      }
    }

    return urls;
  }

  async findLinksRegex(url, regex) {
    console.log('findLinksRegex', url, regex);
    const doc = await this.fetcher.first(url);
    const re = new RegExp(regex + '$');
    const urls = [];
    const limit = 30;
    for (const link of doc.links) {
      if (link.url == url) {
        continue;
      }

      if (re.test(link.url)) {
        urls.push(link.url);
      }

      if (urls.length == limit) {
        break;
      }
    }

    // console.log('matching urls:', urls);

    return urls;
  }

  async extractData(url, schema) {
    console.log('extractData', url, schema);
    const items = [];
    const spe = new SinglePromptExtractor({ ai: this.ai, fetcher: this.fetcher });
    const limit = 5;
    for await (const item of spe.run(url, schema)) {
      console.log('item -->', JSON.stringify(item));
      items.push(item);
      if (items.length == limit) {
        break;
      }
    }
    return items;
  }
}
