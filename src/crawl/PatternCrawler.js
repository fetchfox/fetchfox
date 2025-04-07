import PQueue from 'p-queue';
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
    const linksChan = createChannel();
    const resultsChan = createChannel();

    let done = false;

    let abortListener;
    if (this.signal) {
      abortListener = () => {
        done = true;
      };
      this.signal.addEventListener('abort', abortListener);
    }

    const linksPromise = new Promise(async (ok, bad) => {
      try {
        for (let i = 0 ; i < 10; i++) {
          if (done) break;

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
            if (done) break;

            suggestions.push(delta);
            ratings[delta.url] = delta.rating;
            this.logger.debug(`${this} Got candidate to visit next: ${JSON.stringify(delta)}`);
            if (suggestions.length > 10) {
              break;
            }
          }
          if (done) break;

          suggestions.sort((a, b) => parseInt(b.rating) - parseInt(a.rating));

          const url = suggestions[0].url;
          const result = await this.process(url, pattern);
          state[url] = result;

          candidates.push(...result.all.map(it => it.url));

          let count = 0;
          this.logger.debug(`${this} Yielding ${result.matches.length} pattern matches, first is ${JSON.stringify(result.matches[0])}`);
          for (const link of result.matches) {
            if (yielded[link.url]) {
              continue;
            }
            yielded[link.url] = true;
            linksChan.send(link);
            count++;
          }

          // If we didn't find new ones, exit
          if (count == 0 && i >= 3) {
            break;
          }
        }

        ok();

      } catch (e) {
        bad(e);
        return;

      } finally {
        linksChan.end();
      }
    });

    const q = new PQueue({ concurrency: 8 });

    const resultsPromise = new Promise(async (ok, bad) => {
      try {

        const promises = [];

        for await (const val of linksChan.receive()) {
          if (val.end || done || this.signal?.aborted) {
            break;
          }

          let p;
          if (options.pull) {
            p = this.fetcher.first(val.url)
              .then((doc) => {
                if (done || this.signal?.aborted) {
                  return;
                }

                const fields = [
                  'html',
                  'text',
                  'markdown',
                  'htmlUrl',
                  'textUrl',
                  'markdownUrl',
                ];

                for (const field of fields) {
                  if (doc[field]) {
                    val[field] = doc[field];
                  }
                }
                return val;
                ;
              });

          } else {
            p = Promise.resolve(val);
          }
          p.then(it => resultsChan.send(it));
          promises.push(p);
        }

        await Promise.allSettled(promises);

        ok();

      } catch (e) {
        bad(e);

      } finally {
        resultsChan.end();
      }

    });

    try {
      for await (const val of resultsChan.receive()) {
        if (val.end) {
          break;
        }

        yield Promise.resolve(val);
      }

      await linksPromise;
      await resultsPromise;

    } finally {
      if (abortListener) {
        this.signal.removeEventListener('abort', abortListener);
      }
      done = true;
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
      const links = doc.links.map(it => ({ ...it, url: clean(it.url) }));
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
