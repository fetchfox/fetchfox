import { shuffle as stableShuffle } from '../util.js';
import { getFetcher, getAI, DiskCache } from '../index.js';
import { TagRemovingMinimizer } from '../min/TagRemovingMinimizer.js';
import { URL } from 'whatwg-url';
import * as prompts from './prompts.js';

let cache = new DiskCache('/tmp/ff-cache', { ttls: { base: 1e100 } });
// cache = null;

export class Learner {
  constructor(options) {
    this.fetcher = options?.fetcher || getFetcher(null, { cache });
    this.ai = options?.ai || getAI(null, { cache });
  }

  // Learn about a single URL
  async learn({ url, prompt, ...rest }) {
    url = (new URL(url)).toString();
    const iterations = 3;
    const numRelevant = 3;
    const maxPerCategory = 3;
    const maxPerIteration = 10;
    let targets = [{ urls: [url], pattern: url }];
    let data = {};

    for (let i = 0; i < iterations; i++) {
      console.log(`\n\n\t== Iteration ${i} ==\n`);

      targets = stableShuffle(targets).slice(0, maxPerIteration);
      console.log('Targets:', targets.length);

      await Promise.all(targets.map(async (target) => {
        const urls = target.urls.slice(0, maxPerCategory);
        const docs = await Promise.all(urls.map(url => this.fetcher.first(url)));
        target.docs = docs;
      }));
      const analyses = await Promise.all(targets.map(async ({ docs, pattern }) => {
        console.log('\n');
        for (const doc of docs) {
          console.log('\t=> Analyze:', pattern, doc.url);
        }
        console.log('\n');
        const analysis = await this.analyze({ docs, prompt, ...rest });
        data = await this.update(data, pattern, analysis);
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

  // Update knowledge base based on new analysis
  async update(kb, pattern, delta) {
    for (const it of delta.linksTo) {
      kb[it.pattern] ||= { examples: [] };
      const existing = kb[it.pattern].examples;
      const add = it.examples;
      const set = new Set([...add, ...existing]);
      kb[it.pattern].examples = new Array(...set).sort();
      kb[it.pattern].examples = stableShuffle(kb[it.pattern].examples).slice(0, 10);
      // console.log('udated examples:', it.pattern, kb[it.pattern].examples);
    }

    if (kb[pattern]) {
      // // TODO: should not use AI to merge this, it is too big
      // kb[pattern] = await aiMerge(this.ai, [delta, kb[pattern]]);

      const before = kb[pattern].examples || [];
      kb[pattern] = delta;
      kb[pattern].examples = before;
    } else {
      kb[pattern] = delta;
    }
    kb[pattern].pattern = pattern;
    return kb;
  }

  // Analyze several documents
  async analyze({ docs, prompt, ...rest }) {
    const doc = docs[0];
    if (!doc) {
      return null;
    }

    const urls = docs.map(it => it.url);

    const description = await this.analyzeDescription({ docs, ...rest });
    const linksTo = await this.analyzeLinksTo({ docs, prompt, ...rest });
    const items = await this.analyzeItems({ docs, prompt, ...rest });
    const data = { description, items, linksTo, examples: urls };
    return data;
  }

  async analyzeDescription({ docs, ...rest }) {
    const context = { htmls: joinDocsHtml(docs) };
    const { prompt } = await prompts
      .description
      .renderCapped(context, 'htmls', this.ai);
    const answer = await this.ai.ask(prompt, { format: 'json' });
    return answer.partial;
  }

  async analyzeLinksTo({ docs, prompt, ...rest }) {
    const urls = [];
    const min = new TagRemovingMinimizer({ cache });
    const seen = {};
    for (const doc of docs) {
      // console.log(doc.links);
      const minDoc = await min.min(doc);
      for (const link of minDoc.links) {
        if (seen[link.url]) {
          continue;
        }
        seen[link.url] = true;
        urls.push({
          url: link.url.substring(0, 200),
          text: link.text.substring(0, 200),
          html: link.html.substring(0, 200),
        });
      }
    }

    const subset = stableShuffle(urls).slice(0, 100);
    console.log('categorizing this subset of links:');
    for (const it of subset) {
      console.log('- url=' + it.url);
    }
    const context = { urls: JSON.stringify(subset, null, 2), prompt };
    const { prompt: catPrompt } = await prompts
      .categorize
      .renderCapped(context, 'urls', this.ai);
    const results = [];

    // console.log(catPrompt);

    const stream = this.ai.stream(catPrompt, { format: 'jsonl' });
    for await (const { delta } of stream) {
      delta.pattern = cleanPattern(delta.pattern);
      console.log('found ->', delta);
      results.push(delta);
    }
    return results;
  }

  async analyzeItems({ docs, prompt, ...rest }) {
    const context = { urls: joinDocsUrl(docs), prompt, htmls: joinDocsHtml(docs) };
    const { prompt: itemsPrompt } = await prompts
      .availableItems
      .renderCapped(context, 'htmls', this.ai);
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
    const { prompt: pickPrompt } = await prompts
      .pickRelevant
      .renderCapped(context, 'linksTo', this.ai);
    console.log('pick relevant prompt:', pickPrompt);
    const stream = this.ai.stream(pickPrompt, { format: 'jsonl' });

    const results = [];
    for await (const { delta } of stream) {
      console.log('pick relevant ->', delta);
      results.push(delta);
    }

    console.log(JSON.stringify(results, null, 2));

    const top = results
      .sort((a, b) => parseInt(b.rating) - parseInt(a.rating))
      .slice(0, count);

    // console.log('returning patterns top:', top);
    // console.log('linksTo', linksTo);
    for (const it of top) {
      for (const linkTo of linksTo) {
        if (it.pattern == linkTo.pattern) {
          it.regex = linkTo.regex;
        }
      }
    }

    const urls = doc.links.map(it => it.url);
    const matched = await this._matchToPatterns(top, urls, prompt);
    console.log('matched', matched);
    return matched;
  }

  async _matchToPatterns(patterns, urls, prompt) {
    // Regex matcher
    // console.log('_matchToPatterns', patterns);
    // const categorized = {};
    // for (const url of urls) {
    //   for (const pattern of patterns) {
    //     const re = new RegExp(pattern.regex);
    //     // console.log(re);
    //     if (re.test(url)) {
    //       console.log('re match ->', pattern.regex, url);
    //       categorized[pattern.pattern] ||= [];
    //       categorized[pattern.pattern].push(url);
    //     }
    //   }
    // }
    // return categorized;

    // AI matcher
    const context = {
      patterns: JSON.stringify(patterns.map(it => ({
        pattern: it.pattern,
        description: it.analysis,
      })), null, 2),
      urls: JSON.stringify(urls, null, 2),
      prompt,
    };
    // console.log('match patterns with ai:', context);
    const { prompt: matchPrompt } = await prompts
      .matchToPatterns
      .renderCapped(context, 'urls', this.ai);
    const categorized = {};
    const stream = this.ai.stream(matchPrompt, { format: 'jsonl' });
    for await (const { delta: { url, pattern } } of stream) {
      console.log(`match pattern -> url=${url} pattern=${pattern}`);
      categorized[pattern] ||= [];
      categorized[pattern].push(url);
    }
    return categorized;
  }
}

const aiMerge = async (ai, objects) => {
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
