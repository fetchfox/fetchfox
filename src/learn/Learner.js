import pretty from 'pretty';
import { parse } from 'node-html-parser';
import { logger as defaultLogger } from '../log/logger.js';
import { getFetcher, getAI } from '../index.js';
import * as prompts from './prompts.js';

export const Learner = class {
  constructor(kb, options) {
    this.kb = kb;

    this.logger = options?.logger || defaultLogger;
    this.cache = options?.cache;
    this.fetcher = options?.fetcher || getFetcher(null, { cache: this.cache });
    this.ai = options?.ai || getAI(null, { cache: this.cache });
  }

  async learn({ url, prompt, ...rest }, cb) {
    this.logger.info(`${this} Learn about url=${url} prompt=${prompt}`);

    url = new URL(url).toString();

    console.log('url, prompt', url, prompt);
    const urls = [url];
    console.log('urls', urls);
    const docs = await Promise.all(urls.map(url => this.fetcher.first(url)));

    const update = async (url, type, fact) => {
      await this.kb.update(url, type, fact);
      cb && cb();
    }

    await Promise.all([
      this.analyzeLinks(
        { docs, prompt, ...rest },
        (fact) => update(url, 'links', fact)
      ),

      this.analyzeItems(
        { docs, prompt, ...rest },
        (fact) => update(url, 'items', fact)
      ),
    ]);
  }

  async analyzeItems({ docs, prompt }, cb) {
    const urls = joinDocsUrl(docs);
    const htmls = joinDocsHtml(docs, 'selectHtml');
    const context = { urls, prompt, htmls };
    const { prompt: itemsPrompt } = await prompts
      .availableItems
      .renderCapped(context, 'htmls', this.ai);

    const results = [];
    this.logger.debug(`${this} Analyzing items`);
    const gen = this.ai.stream(itemsPrompt, { format: 'jsonl' });
    for await (const { delta } of gen) {
      console.log('ITEM delta', delta);
      results.push(delta);
      cb && cb(delta);
    }

    return results;
  }

  async analyzeLinks({ docs, prompt }, cb) {
    // TODO: It may work better to get a list of the URLs and shuffle.
    // Test/compare it.
    // https://github.com/fetchfox/fetchfox/blob/d/x-learn/src/x/learn.js#L144

    const htmls = joinDocsHtml(docs, 'html');
    const links = [];
    for (let i = 0; i < docs.length; i++) {
      const doc = docs[i];
      const html = doc.html;
      const baseUrl = doc.url;
      const root = parse(html);
      console.log('html', html);
      console.log(`root.querySelectorAll('a')`, root.querySelectorAll('a'));
      root.querySelectorAll('a').forEach(a => {
        const href = a.getAttribute('href');
        console.log('a', a, href);
        if (!href) return;

        let url;
        try {
          url = new URL(href, baseUrl).href;
        } catch (e) {
          return;
        }

        links.push({
          url,
          text: a.text.trim(),
          html: a.toString(),
        });
      });
    }
    
    const urls = joinDocsUrl(docs);
    const context = {
      // htmls,
      links: JSON.stringify(links, null, 2),
      urls,
      prompt,
    };
    const { prompt: linkPrompt } = await prompts
      .availableLinks
      .renderCapped(context, 'links', this.ai);

    const results = [];
    this.logger.debug(`${this} Analyzing links`);
    const gen = this.ai.stream(linkPrompt, { format: 'jsonl' });
    for await (const { delta } of gen) {
      delta.pattern = cleanPattern(delta.pattern);
      console.log('found ->', delta);
      results.push(delta);
      cb && cb(delta);
    }

    return results;
  }
}

const cleanPattern = (pattern) => {
  return pattern.replace(/:(\w+(?:-\w+)+)/g, (_, part) => `:${part.replace(/-/g, '')}`);
}

const joinDocsHtml = (docs, view) => {
  const htmls = docs.map(doc => pretty(doc[view], { ocd: true }));
  return htmls.map((html, idx) => `HTML ${idx}:\n${html}`).join('\n\n');
}

const joinDocsUrl = (docs) => {
  return docs.map((doc, idx) => `URL ${idx}:\n${doc.url}`).join('\n');
}
