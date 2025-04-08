import { BaseCrawler } from './BaseCrawler.js';
import { createChannel } from '../util.js';
import * as prompts from './prompts.js'

const clean = url => {
  const u = new URL(url);
  return u.origin + u.pathname;
}

export const PatternCrawler = class extends BaseCrawler {
  async *run(patterns, options) {
    this.logger.info(`${this} Start find matches for ${patterns.join(', ')}`);

    const chan = createChannel()

    const promises = [];
    const handleResult = (result) => {
      chan.send({ result });
    }

    for (const pattern of patterns) {
      const p = this.runSingle(pattern, options, handleResult);
      promises.push(p);
    }

    const all = Promise.allSettled(promises).then(() => chan.end());

    for await (const val of chan.receive()) {
      if (val.end) {
        break;
      }

      yield Promise.resolve(val.result);
    }

    await all;
  }

  async runSingle(pattern, options, onResult) {
    this.logger.info(`${this} Find matches for ${pattern}`);

    const url = new URL(pattern);
    let candidates = [
      url.origin,
      pattern.replace(/\*$/, ''),
    ];

    const state = {};
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
        for (let i = 0 ; i < 20; i++) {
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
          const max = 8;
          for await (const { delta } of gen) {
            if (done) break;

            suggestions.push(delta);
            ratings[delta.url] = delta.rating;
            this.logger.debug(`${this} Got candidate to visit next: ${JSON.stringify(delta)}`);
            if (suggestions.length > max) {
              break;
            }
          }
          if (done) break;

          const results = await Promise.allSettled(suggestions
            .map(it => this.process(it.url, pattern)));

          let count = 0;
          for (let i = 0; i < suggestions.length; i++) {
            const result = results[i];
            if (result.status != 'fulfilled') {
              continue;
            }
            const url = suggestions[i].url;
            state[url] = result.value; 
            candidates.push(...result.value.all.map(it => it.url));

            this.logger.debug(`${this} Yielding ${result.value.matches.length} pattern matches, first is ${JSON.stringify(result.value.matches[0])}`);
            for (const link of result.value.matches) {
              if (yielded[link.url]) {
                continue;
              }
              yielded[link.url] = true;
              linksChan.send(link);
              count++;
            }
          }

          this.logger.debug(`${this} Number of new results was ${count} on i=${i}`);

          // If we didn't find new ones, exit
          if (count == 0 && i >= 3) {
            done = true;
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

    const resultsPromise = new Promise(async (ok, bad) => {
      try {

        const promises = [];

        for await (const val of linksChan.receive()) {
          if (val.end || done || this.signal?.aborted) {
            break;
          }

          let p;
          if (options?.pull) {
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
          p
            .then(it => resultsChan.send(it))
            .catch((e) => {
              if (process.env.STRICT_ERRORS) {
                bad(e);
              } else {
                this.logger.error(`${this} Unexpected error: ${e}`);
              }
            });
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

        onResult(val);
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
    this.logger.debug(`${this} Processing ${url}`);

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
