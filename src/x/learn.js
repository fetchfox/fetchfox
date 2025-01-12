import { shuffle } from 'radash';
import { getFetcher, getAI } from '../index.js';
import { URL } from 'whatwg-url';
import * as prompts from './prompts.js';

export class Learner {
  constructor(options) {
    this.kb = new KnowledgeBase(options)
    this.fetcher = options?.fetcher || getFetcher();
    this.ai = options?.ai || getAI();
  }

  async learn({ url, prompt, ...rest }) {
    const data = await this.kb.analyze({ url, prompt, ...rest });
    console.log(JSON.stringify(data, null, 2));
    const doc = await this.fetcher.first(url);

    const relevant = await this.pickRelevant(doc, data, prompt);
    for (const pattern of Object.keys(relevant)) {
      const promises = relevant[pattern].map(url => {
        return this.kb.analyze({ url, prompt, ...rest });
      });
      console.log('data', pattern);
      console.log('relevant[pattern]', relevant[pattern]);
      const datas = await Promise.all(promises);
      console.log(datas);

      const mergePrompt = `Merge these ${datas.length} similar objects, combining the data while eliminating redundancy.  Keep the same top level keys. Return ONLY JSON, your response will be machine parsed using JSON.parse(). No english comments.\n\n` + datas.map((it, idx) => `\n\nObject ${idx}:\n${JSON.stringify(it, null, 2)}`);

      console.log('mergePrompt', mergePrompt);

      console.log('== merged ==');
      const merged = await this.ai.ask(mergePrompt, { format: 'json' });
      console.log(JSON.stringify(merged, null, 2));
    }

    return {};
  }

  async pickRelevant(doc, data, prompt) {
    const context = {
      url: doc.url,
      prompt,
      linksTo: JSON.stringify(data.linksTo, null, 2),
    };
    const { prompt: catPrompt } = await prompts
      .pickRelevant.renderCapped(context, 'linksTo', this.ai);
    const answer = await this.ai.ask(catPrompt, { format: 'text' });
    console.log(answer.partial);
    const patterns = answer.partial.split('\n').map(it => it.trim()).filter(Boolean);
    const urls = doc.links.map(it => it.url);
    const categorized = categorizeUrls(patterns, urls);

    const final = {};
    for (const pattern of Object.keys(categorized)) {
      final[pattern] = shuffle(categorized[pattern]).slice(0, 3);
    }
    
    return final;
  }
}

function categorizeUrls(patterns, urls) {
  const categorized = {};
  for (const pattern of patterns) {
    const regex = new RegExp(pattern.replace(/:[A-Za-z0-9-]+/g, '[^/]+') + '$');
    categorized[pattern] = urls.filter(url => regex.test(url));
  }
  return categorized;
}

export class KnowledgeBase {
  constructor(options) {
    this.data = {};
    this.fetcher = options?.fetcher || getFetcher();
    this.ai = options?.ai || getAI();
  }

  async analyze({ url, prompt, ...rest }) {
    const linksTo = await this.analyzeLinksTo({ url, prompt, ...rest });
    const items = await this.analyzeItems({ url, prompt, ...rest });
    const data = { items, linksTo };
    return data;
  }

  async analyzeLinksTo({ url, prompt, ...rest }) {
    const doc = await this.fetcher.first(url);
    const urls = doc.links.map(it => it.url);
    urls.push(url);
    const context = { urls: urls.join('\n') };
    const { prompt: catPrompt } = await prompts
      .categorize.renderCapped(context, 'urls', this.ai);
    const answer = await this.ai.ask(catPrompt, { format: 'text' });
    const patterns = answer.partial.split('\n').map(s => s.trim()).filter(Boolean);
    return patterns;
  }

  async analyzeItems({ url, prompt, ...rest }) {
    const doc = await this.fetcher.first(url);
    const context = { url, prompt, html: doc.html };
    const { prompt: itemsPrompt } = await prompts
      .availableItems.renderCapped(context, 'html', this.ai);
    const answer = await this.ai.ask(itemsPrompt, { format: 'jsonl' });
    // console.log('answer', JSON.stringify(answer.partial, null, 2));
    return answer.partial.result;
  }
}
