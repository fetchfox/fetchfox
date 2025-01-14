import { shuffle } from 'radash';
import { getFetcher, getAI } from '../index.js';
import { URL } from 'whatwg-url';
import UrlPattern from 'url-pattern';
import * as prompts from './prompts.js';

const urlPatternOptions = { segmentValueCharset: 'a-zA-Z0-9-_~ %()' };

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
      data = await aiMerge(datas, this.ai);
    }
    return data;
  }

  async learn({ url, prompt, ...rest }) {
    url = (new URL(url)).toString();
    const iterations = 4;
    const numRelevant = 3;
    const maxPerCategory = 3;
    const maxPerIteration = 10;
    let targets = [{ urls: [url], pattern: url }];
    const data = {};

    for (let i = 0; i < iterations; i++) {
      console.log(`== Iteration ${i} ==`);
      targets = shuffle(targets).slice(0, maxPerIteration);
      console.log('Targets:', targets.length);

      await Promise.all(targets.map(async (target) => {
        const urls = target.urls.slice(0, maxPerCategory);
        const docs = await Promise.all(urls.map(url => this.fetcher.first(url)));
        target.docs = docs;
      }));
      const analyses = await Promise.all(targets.map(async ({ docs, pattern }) => {
        const analysis = await this.analyze({ docs, prompt, ...rest });
        data[pattern] = analysis;
        return analysis;
      }));

      console.log('Data so far:');
      console.log(JSON.stringify(data, null, 2));

      const relevants = await Promise.all(targets.map((target, idx) => {
        return this._pickRelevant(target.docs[0], analyses[idx].linksTo, prompt, numRelevant);
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
        const urls = relevant[pattern].slice(0, maxPerCategory);
        targets.push({ urls, pattern });
      }
    }

    return data;
  }

  async analyze({ docs, prompt, ...rest }) {
    console.log('docs', docs.map(doc => '' + doc));

    const doc = docs[0];
    console.log('kb analyze:', doc?.url);
    if (!doc) {
      return null;
    }

    const description = await this.analyzeDescription({ docs, ...rest });
    const linksTo = await this.analyzeLinksTo({ docs, prompt, ...rest });
    const items = await this.analyzeItems({ docs, prompt, ...rest });
    const data = { description, items, linksTo };
    return data;
  }

  async analyzeDescription({ docs, ...rest }) {
    const context = { htmls: joinDocsHtml(docs) };
    const { prompt } = await prompts.description.renderCapped(
      context, 'htmls', this.ai);
    const answer = await this.ai.ask(prompt, { format: 'json' });
    return answer.partial;
  }

  async analyzeLinksTo({ docs, prompt, ...rest }) {
    let urls = [];
    for (const doc of docs) {
      urls.push(...doc.links.map(it => it.url));
    }
    // console.log(docs);
    docs.map(doc => urls.push(doc.url));
    urls = new Array(...(new Set(urls)));
    const context = { urls: urls.join('\n'), prompt };
    const { prompt: catPrompt } = await prompts
      .categorize.renderCapped(context, 'urls', this.ai);
    const results = [];
    const stream = this.ai.stream(catPrompt, { format: 'jsonl' });
    for await (const { delta } of stream) {
      delta.pattern = cleanPattern(delta.pattern);
      console.log('found ->', delta.pattern);
      results.push(delta);
    }
    return results;
  }

  async analyzeItems({ docs, prompt, ...rest }) {
    const context = { urls: joinDocsUrl(docs), prompt, htmls: joinDocsHtml(docs) };
    const { prompt: itemsPrompt } = await prompts
      .availableItems.renderCapped(context, 'htmls', this.ai);
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
      .slice(0, count);
      // .map(result => result.pattern);

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
      console.log(`match pattern -> url=${url} pattern=${pattern}`);
      const p = new UrlPattern(pattern.replace(/^https:/, 'https\\:'), urlPatternOptions);
      if (!p.match(url)) {
        console.log('AI made a mistake, skip it');
        continue;
      }
      categorized[pattern] ||= [];
      categorized[pattern].push(url);
    }
    return categorized;
  }
}

function categorizeUrls(patterns, urls) {
  const categorized = {};

  patterns.sort((a, b) => {
    const patternA = new UrlPattern(a.replace(/^https:/, 'https\\:'), urlPatternOptions);
    const patternB = new UrlPattern(b.replace(/^https:/, 'https\\:'), urlPatternOptions);
    const aMatches = urls.some(url => patternB.match(url) && patternA.match(url));
    const bMatches = urls.some(url => patternA.match(url) && patternB.match(url));
    if (aMatches && !bMatches) return 1;
    if (bMatches && !aMatches) return -1;
    return 0;
  });

  for (const pattern of patterns) {
    const p = new UrlPattern(pattern.replace(/^https:/, 'https\\:'), urlPatternOptions);
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

const aiMerge = async (objects) => {
  const mergePrompt = `Merge these ${objects.length} similar objects, combining the data while eliminating redundancy.  Keep the same top level keys. Return ONLY JSON, your response will be machine parsed using JSON.parse(). No english comments.\n\n` + objects.map((it, idx) => `\n\nObject ${idx + 1}:\n${JSON.stringify(it, null, 2)}`);
  const merged = await ai.ask(mergePrompt, { format: 'json' });
  return merged.partial;
}

const splitLinks = (text) => {
  return text
    .split('\n')
    .map(it => it.trim())
    .filter(it => ('' + it).startsWith('http'));
}

const cleanPattern = (pattern) => {
  return pattern.replace(/:(\w+(?:-\w+)+)/g, (_, part) => `:${part.replace(/-/g, '')}`);
}

const joinDocsHtml = (docs) => {
  return docs.map((doc, idx) => `HTML ${idx}:\n${doc.html}`).join('\n\n');
}

const joinDocsUrl = (docs) => {
  return docs.map((doc, idx) => `URL ${idx}:\n${doc.url}`).join('\n');
}
