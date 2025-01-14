import { shuffle } from 'radash';
import { getFetcher, getAI } from '../index.js';
import { URL } from 'whatwg-url';
import UrlPattern from 'url-pattern';
import * as prompts from './prompts.js';

export class Learner {
  constructor(options) {
    this.kb = new KnowledgeBase(options)
    this.fetcher = options?.fetcher || getFetcher();
    this.ai = options?.ai || getAI();
  }

  async learnMulti({ urls, prompt, ...rest }) {
    const promises = urls.map(url => {
      return this.analyze({ url, prompt, ...rest });
    });
    const datas = await Promise.all(promises);
    let data;
    if (datas.length == 1) {
      data = datas[0];
    } else {
      const mergePrompt = `Merge these ${datas.length} similar objects, combining the data while eliminating redundancy.  Keep the same top level keys. Return ONLY JSON, your response will be machine parsed using JSON.parse(). No english comments.\n\n` + datas.map((it, idx) => `\n\nObject ${idx + 1}:\n${JSON.stringify(it, null, 2)}`);
      const merged = await this.ai.ask(mergePrompt, { format: 'json' });
      data = merged.partial;
    }
    return data;
  }

  async learn({ url, prompt, ...rest }) {
    url = (new URL(url)).toString();
    const iterations = 4;
    const numRelevant = 3;
    const maxPerIteration = 10;
    let targets = [{ url, pattern: url }];
    const data = {};

    for (let i = 0; i < iterations; i++) {
      console.log(`== Iteration ${i} ==`);
      targets = shuffle(targets).slice(0, maxPerIteration);
      console.log('Targets:', targets.length);
      const docs = await Promise.all(targets.map(({ url }) => {
        return this.fetcher.first(url);
      }));
      const analyses = await Promise.all(targets.map(async ({ pattern }, idx) => {
        const analysis = await this.analyze({ doc: docs[idx], prompt, ...rest });
        data[pattern] = analysis;
        return analysis;
      }));
      const relevants = await Promise.all(docs.map((doc, idx) => {
        return this._pickRelevant(doc, analyses[idx].linksTo, prompt, numRelevant);
      }));
      const relevant = {};
      for (const r of relevants) {
        for (const key of Object.keys(r)) {
          relevant[key] = r[key];  // This may override data
        }
      }
      console.log('relevant links:');
      console.log(JSON.stringify(relevant, null, 2));
      targets = [];
      for (const pattern of Object.keys(relevant)) {
        const urls = relevant[pattern].slice(0, 3);
        targets.push(...(urls.map(url => ({ url, pattern }))));
      }
    }

    return data;
  }

  async analyze({ doc, prompt, ...rest }) {
    console.log('kb analyze:', doc.url);
    const description = await this.analyzeDescription({ doc, ...rest });
    const linksTo = await this.analyzeLinksTo({ doc, prompt, ...rest });
    const items = await this.analyzeItems({ doc, prompt, ...rest });
    const data = { description, items, linksTo };
    return data;
  }

  async analyzeDescription({ doc, ...rest }) {
    const context = { html: doc.html };
    const { prompt } = await prompts.description.renderCapped(
      context, 'html', this.ai);
    const answer = await this.ai.ask(prompt, { format: 'json' });
    return answer.partial;
  }

  async analyzeLinksTo({ doc, prompt, ...rest }) {
    const urls = doc.links.map(it => it.url);
    urls.push(doc.url);
    const context = { urls: urls.join('\n'), prompt };
    const { prompt: catPrompt } = await prompts
      .categorize.renderCapped(context, 'urls', this.ai);
    const results = [];
    const stream = this.ai.stream(catPrompt, { format: 'jsonl' });
    for await (const { delta } of stream) {
      console.log('found ->', delta.pattern);
      results.push(delta);
    }
    return results;
  }

  async analyzeItems({ doc, prompt, ...rest }) {
    const context = { url: doc.url, prompt, html: doc.html };
    const { prompt: itemsPrompt } = await prompts
      .availableItems.renderCapped(context, 'html', this.ai);
    const answer = await this.ai.ask(itemsPrompt, { format: 'jsonl' });

    console.log('analyze items answer.partial:', answer.partial);

    return answer.partial.result;
  }

  async _pickRelevant(doc, linksTo, prompt, count) {
    const context = {
      url: doc.url,
      prompt,
      linksTo: JSON.stringify(linksTo, null, 2),
    };
    const { prompt: catPrompt } = await prompts
      .pickRelevant.renderCapped(context, 'linksTo', this.ai);
    const stream = this.ai.stream(catPrompt, { format: 'jsonl' });

    const results = [];
    for await (const { delta } of stream) {
      console.log('pick relevant ->', delta);
      results.push(delta);
    }

    console.log(JSON.stringify(results, null, 2));

    const top = results
      .sort((a, b) => parseInt(b.rating) - parseInt(a.rating))
      .slice(0, count)
      .map(result => result.pattern);

    console.log('returning patterns top:', top);
    console.log('linksTo', linksTo);

    const urls = doc.links.map(it => it.url);
    const matched = await this._matchToPatterns(top, urls, prompt);
    console.log('matched', matched);
    return matched;

    // const categorized = categorizeUrls(top, urls);
    // console.log('categorized', categorized);
    // const final = {};
    // for (const pattern of Object.keys(categorized)) {
    //   final[pattern] = shuffle(categorized[pattern]).slice(0, 3);
    // }
    // return final;
  }

  async _matchToPatterns(patterns, urls, prompt) {
    const context = {
      patterns: JSON.stringify(patterns, null, 2),
      urls: JSON.stringify(urls, null, 2),
      prompt,
    };
    const { prompt: matchPrompt } = await prompts
      .matchToPatterns.renderCapped(context, 'urls', this.ai);
    const categorized = {};
    const stream = this.ai.stream(matchPrompt, { format: 'jsonl' });
    for await (const { delta: { url, pattern } } of stream) {
      console.log(`match pattern -> ${url} / ${pattern}`);
      categorized[pattern] ||= [];
      categorized[pattern].push(url);
    }
    return categorized;
  }
}

function categorizeUrls(patterns, urls) {
  const categorized = {};

  patterns.sort((a, b) => {
    const patternA = new UrlPattern(a.replace(/^https:/, 'https\\:'));
    const patternB = new UrlPattern(b.replace(/^https:/, 'https\\:'));
    const aMatches = urls.some(url => patternB.match(url) && patternA.match(url));
    const bMatches = urls.some(url => patternA.match(url) && patternB.match(url));
    if (aMatches && !bMatches) return 1;
    if (bMatches && !aMatches) return -1;
    return 0;
  });

  for (const pattern of patterns) {
    const p = new UrlPattern(pattern.replace(/^https:/, 'https\\:'));
    // const regex = new RegExp(pattern.replace(/:[A-Za-z0-9-]+/g, '[^/]+') + '$');
    categorized[pattern] = urls.filter(url => p.match(url));
  }
  return categorized;
}

export class KnowledgeBase {
  constructor(options) {
    this.data = {};
    this.fetcher = options?.fetcher || getFetcher();
    this.ai = options?.ai || getAI();
  }
}

const splitLinks = (text) => {
  return text
    .split('\n')
    .map(it => it.trim())
    .filter(it => ('' + it).startsWith('http'));
}
