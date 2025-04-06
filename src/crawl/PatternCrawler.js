import chalk from 'chalk';
import { logger } from '../log/logger.js';
import { BaseCrawler } from './BaseCrawler.js';
import { createChannel, shuffle } from '../util.js';
import * as prompts from './prompts.js'

const clean = url => url
  .replace(/#.*/, '')
  .replace(/\/$/, '');

export const PatternCrawler = class extends BaseCrawler {
  async *run(startUrl, pattern, options) {
    this.logger.info(`${this} Start at ${startUrl} and find matches for ${pattern}`);

    const state = {};
    let candidates = [startUrl];
    const ratings = {};

    const yielded = {};

    for (let i = 0 ; i < 10; i++) {
      this.logger.debug(`${this} Looking for URLs matching pattern ${pattern}, iteration ${i}`);
      candidates = [...(new Set(
        candidates
          .map(clean)
          .filter(it => !state[it])
        ).values()
      )];
      candidates
        .sort((a, b) => (
          (ratings[b] || 0) - (ratings[a] || 0)
        ));

      const counts = {};
      for (const [url, result] of Object.entries(state)) {
        counts[url] = result.matches.length;
      }
      const context = {
        urls: candidates.slice(0, 200).join('\n'),
        counts: JSON.stringify(counts, null, 2),
        pattern,
      }
      const { prompt } = await prompts.rank.renderCapped(context, 'counts', this.ai);
      const gen = this.ai.stream(prompt, { format: 'jsonl' });
      const suggestions = [];
      const max = 10;
      for await (const { delta } of gen) {
        suggestions.push(delta);
        ratings[delta.url] = delta.rating;
        this.logger.debug(`${this} Got candidate to visit next: ${JSON.stringify(delta)}`);
        if (suggestions.length > 10) {
          break;
        }
      }

      suggestions.sort((a, b) => parseInt(b.rating) - parseInt(a.rating));

      const url = suggestions[0].url;
      const result = await this.process(url, pattern);
      state[url] = result;

      candidates.push(...result.all.map(it => it.url));

      let count = 0;
      for (const link of result.matches) {
        if (yielded[link.url]) {
          continue;
        }
        yielded[link.url] = true;
        this.logger.debug(`${this} Yielding pattern match ${link.url}`);
        yield Promise.resolve(link);
        count++;
      }

      // If we didn't find new ones, exit
      if (count == 0 && i >= 3) {
        break;
      }
    }
  }

  async process(url, pattern) {
    this.logger.debug(`${this} Proecssing ${url}`);

    const re = new RegExp(pattern.replaceAll('*', '.*'));
    const result = {
      matches: [],
      all: [],
    }
    for await (const doc of this.getDocs(url)) {
      const links = doc.links().map(it => ({ ...it, url: clean(it.url) }));
      result.all.push(...links);
      for (const link of links) {
        if (link.url.match(re)) {
          result.matches.push(link);
        }
      }
    }

    this.logger.debug(`${this} Found ${result.matches.length} matches for ${pattern} on ${url}`);

    return result;
  }
};
