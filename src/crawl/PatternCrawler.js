import { BaseCrawler } from './BaseCrawler.js';
import { createChannel, promiseAllStrict } from '../util.js';
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

    const all = promiseAllStrict(promises).then(() => chan.end());

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
      { url: url.origin },
      { url: pattern.replace(/\*.*$/, '') },
    ];
    if (options?.suggestions) {
      for (const url of options?.suggestions) {
        candidates.push({ url });
      }
    }

    this.logger.debug(`${this} Initial candidates: ${JSON.stringify(candidates)}`);

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

    /* eslint-disable no-async-promise-executor */
    const linksPromise = new Promise(async (ok, bad) => {
      try {
        for (let i = 0 ; i < 20; i++) {
          if (done) break;

          this.logger.debug(`${this} Looking for URLs matching pattern ${pattern}, iteration ${i}`);

          candidates = sift(candidates, url, state);
          candidates
            .sort((a, b) => (
              (ratings[b.url] || 0) - (ratings[a.url] || 0)
            ));

          let c = 0;
          const counts = {};
          for (const [url, result] of Object.entries(state)) {
            if (result.matches.length) {
              c++
              counts[url] = result.matches.length;
            }
          }

          const context = {
            urls: JSON.stringify(candidates.slice(0, 1000), null, 2),
            counts: JSON.stringify(counts, null, 2),
            pattern,
          }
          const { prompt } = await prompts.rank.renderCapped(context, 'counts', this.ai);
          const gen = this.ai.stream(prompt, { format: 'jsonl' });
          const suggestions = [];
          const max = 32;

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
            candidates.push(...result.value.all.map(
              it => ({ url: it.url, text: it.text })));

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
          if (count == 0 && i >= 5) {
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
                  'metadata',
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
    /* eslint-enable no-async-promise-executor */

    try {
      for await (const val of resultsChan.receive()) {
        if (val.end) {
          break;
        }

        onResult(val);
      }

      await linksPromise;
      await resultsPromise;

    } catch (e) {
      throw e;

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

const sift = (links, startUrl, state) => {
  const out = [];
  const seen = {};
  for (const link of links) {
    let u;
    try {
      u = new URL(link.url);
    } catch {
      continue;
    }

    // TODO: allow off-domain with restritions/limitations
    if (u.origin != startUrl.origin) {
      continue;
    }

    const y = clean(u.toString());
    if (state[y]) {
      continue;
    }
    if (seen[y]) {
      continue;
    }
    seen[y] = true;
    out.push({ ...link });
  }

  return out;
}
