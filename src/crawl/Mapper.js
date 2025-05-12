import { logger as defaultLogger } from '../log/logger.js';
import { getAI } from '../ai/index.js'
import { getFetcher } from '../fetch/index.js'
import { PriorityQueue } from './PriorityQueue.js'
import { norm } from './shared.js';
import { shortObjHash } from '../util.js';
import * as prompts from './prompts.js';

export const Mapper = class {
  constructor(options) {
    this.logger = options?.logger || defaultLogger;
    this.ai = options?.ai || getAI();
    this.fetcher = options?.fetcher || getFetcher();
    this.cache = options?.cache;
    this.signal = options?.signal;

    this.patterns = [];
    this.visited = [];

    this._urls = {};
    this._memo = {};
  }

  toString() {
    return `[${this.constructor.name}]`;
  }

  get urls() {
    return Object.keys(this._urls);
  }

  async getCache(vals) {
    if (!this.cache) {
      return;
    }

    const key = 'mapper-' + shortObjHash(vals);
    this.logger.debug(`${this} Check for cached map ${key}`);
    const cached = await this.cache.get(key);
    if (!cached) {
      this.logger.debug(`${this} No cached map ${key}`);
      return false;
    }

    this.logger.debug(`${this} Found cached map ${key}`);
    this.patterns = cached.patterns;
    this._urls = cached._urls;
    this._memo = {};

    return true;
  }

  async setCache(vals) {
    if (!this.cache) return;
    const key = 'mapper-' + shortObjHash(vals);
    this.logger.debug(`${this} Set cached map ${key}`);

    return this.cache.set(key, {
      patterns: this.patterns,
      _urls: this._urls,
    });
  }

  async run(urls, options) {
    this._roots = urls;

    urls = urls.map(norm);

    console.log('urls', urls);

    this.logger.info(`${this} Mapper start on these urls: ${urls.join(', ')}`);

    const maxIterations = options?.maxIterations ?? 10;
    const onIteration = options?.onIteration ? options?.onIteration : () => {};
    const hint = options?.hint || '';

    const cacheKeys = { urls, maxIterations, hint };
    if (await this.getCache(cacheKeys)) {
      return;
    }

    const pq = new PriorityQueue((url) => this.score(url), this);
    urls.forEach(it => pq.add(it));

    for (let i = 0; i < maxIterations && !pq.empty; i++) {
      this.logger.debug(`${this} Mapper iteration #${i} for ${urls.join(', ')}`);

      if (this.signal?.aborted) {
        break;
      }

      const promises = [];
      this.logger.debug(`${this} Pulling links from priority queue`);

      const links = await pq.shiftMany(
        Math.min(4**(i+1), 32), // Grab more on each iteration
        0,
        goalPrompt(this.layoutString(urls), this.visited, hint),
        {
          onLink: (link) => {
            promises.push(this.visit(link.url, pq));
          }
        });

      console.log('links', links);

      this.logger.debug(`${this} Wait for ${promises.length} visits to finish`);
      await Promise.allSettled(promises);
      await this.learn(urls, hint);
      await onIteration(i);
    }

    await this.setCache(cacheKeys);
  }

  async visit(url, pq) {
    this.logger.debug(`${this} Visiting ${url}`);
    const doc = await this.fetcher.first(url);
    this.logger.debug(`${this} Got doc: ${doc}`);

    for (const found of (doc?.links || [])) {
      if (!check(found.url, url)) {
        continue;
      }

      this.connect(url, found.url);
      pq.add(found.url);
    }

    if (!this.visited.includes(norm(url))) {
      this.visited.push(norm(url));
    }
  }

  score(url) {
    return 10;  // TODO
  }
  
  distance(url, targetPattern, n = 0, seen = {}) {
    const key = `url=${url}:tp=${targetPattern}:n=${n}`;
    if (this._memo[key]) {
      return this._memo[key];
    }

    const path = this.toPath(url);
    if (seen[path.name]) {
      return;
    }
    seen[path.name] = true;

    const findRegex = (re) => {
      for (const url of this.urls) {
        if (url.match(re)) {
          return url;
        }
      }
    }

    const re = new RegExp('^' + targetPattern.replaceAll('*', '.*') + '$');
    const example = findRegex(re) || toExample(targetPattern);
    const target = this.toPath(example);

    let result = 999;

    if (!target.regex) {
      return result;
    }

    if (url.match(new RegExp(target.regex))) {
      return n;
    }

    const tos = [...(this.paths[path.name]?.to || [])];
    for (const to of tos) {
      let d;
      if (to.pattern) {
        const url = findRegex(to.regex) || toExample(to.pattern);
        d = this.distance(url, targetPattern, n + 1, seen);
      } else {
        d = this.distance(to.url, targetPattern, n + 1, seen);
      }

      result = d ? Math.min(d, result) : result;
    }

    this._memo[key] = result;
    return result;
  }

  toPath(url) {
    url = norm(url);
    for (const pattern of this.patterns) {
      if (pattern.name == url) {
        return pattern;
      }

      if (url.match(new RegExp(pattern.regex))) {
        return pattern;
      }
    }

    return { url, name: url, pretty: url };
  }

  get paths() {
    if (!this._memo['_paths']) {
      const out = {};
      const urls = Object.keys(this._urls);
      for (const url of urls) {
        const path = this.toPath(url);

        if (!out[path.name]) {
          out[path.name] = { to: [] };
        }

        const seen = {};
        for (const to of (this._urls[url]?.to || [])) {
          const pathTo = this.toPath(to);
          const exists = out[path.name].to.filter(it => it.name == pathTo.name).length
          if (exists) {
            continue;
          }
          out[path.name].to.push(pathTo);
        }
      }
      this._memo['_paths'] = out;
    }

    return this._memo['_paths'];
  }

  examplesForPattern(pattern, num) {
    const l = [];
    const re = new RegExp(pattern.regex);
    for (const url of this.urls) {
      if (url.match(re)) {
        l.push(url);
        if (num && l.length >= num) {
          break;
        }
      }
    }
    return l;
  }

  examples(numPer) {
    const examples = {};
    for (const pattern of this.patterns) {
      examples[pattern.pretty] = this.examplesForPattern(pattern, numPer);
    }

    return examples;
  }

  examplesString(numPer) {
    const examples = this.examples(numPer);
    let s = '\n';
    for (const key of Object.keys(examples)) {
      if (!examples[key]?.length) {
        continue;
      }

      s += `${key}\n`;
      for (const url of examples[key]) {
        s += `\t${url}\n`;
      }
    }
    return s;
  }

  layoutString(urls, depth = 0, depths) {
    const paths = this.paths;

    if (!urls) {
      urls = (
        this._roots ||
        Object.keys(this._urls).filter(it => Boolean(this._urls[it].to?.length))
      );
    }

    if (!depths) {
      depths = {};
      const measure = (path, depth) => {
        depths[path.name] = (
          depths[path.name] === undefined
          ? depth 
          : Math.min(depths[path.name], depth)
        );

        for (const to of (paths[path.name]?.to || [])) {
          if (depths[to.name] === undefined || depths[to.name] > depth) {
            measure(to, depth + 1);
          }
        }
      }

      for (const url of urls) {
        const path = this.toPath(norm(url));
        measure(path, 0);
      }
    }

    const indent = (n) => '\t'.repeat(n);

    let s = '';
    for (const url of urls) {
      const path = this.toPath(norm(url));

      s += indent(depth) + path.pretty + '\n';
      const tos = [...(paths[path.name]?.to || [])].sort(comparePaths);

      for (const to of tos) {
        if (depths[to.name] == depth + 1) {
          s += this.layoutString([to.name], depth + 1, depths);
        } else if (to.pattern) {
          s += indent(depth + 1) + to.pretty + '\n';
        }
      }
    }

    return s;
  }

  connect(src, dst) {
    src = norm(src);
    dst = norm(dst);

    [src, dst].map(it => {
      this._urls[it] ||= {
        to: [],
        from: [],
      };
    });

    this._urls[src].to.push(dst);
  }

  async learn(urls, hint) {
    this.logger.debug(`${this} Learn patterns for ${urls.join(', ')}`);

    this._memo = {};

    const layout = this.layoutString(urls);
    const context = {
      layout,
      // examples: (this.examplesString(5)).substring(0, 10000),
      hint,
    };
    const { prompt } = await prompts.urlPatterns.renderCapped(
      context, 'layout', this.ai);

    let patterns = [...this.patterns];
    const gen = this.ai.stream(prompt, { format: 'jsonl' });
    for await (const { delta } of gen) {
      patterns = patterns.filter(it => it.name != delta.name);

      if (delta.delete) {
        this.logger.debug(`${this} Delete pattern ${delta.name}`);
        continue;
      }

      if (!delta.pattern || !delta.name || !delta.regex) {
        this.logger.warn(`${this} Unexpected format ${JSON.stringify(delta)}`);
        continue;
      }

      try {
        new RegExp(delta.regex);
      } catch {
        this.logger.warn(`${this} Invalid regex ${JSON.stringify(delta)}`);
        continue;
      }

      const pattern = delta.pattern.replace(/\/$/, '');
      this.logger.debug(`${this} Found pattern ${pattern} regex=${delta.regex}`);
      patterns.push({
        ...delta,
        pattern,
        pretty: `[${delta.name}: ${pattern} regex=${delta.regex}]`,
      });
    }

    patterns.sort((a, b) => comparePatterns(a.pattern, b.pattern));
    this.patterns = patterns;

    this._memo = {};
  }
}

const comparePaths = (a, b) => {
  if (a.pattern && !b.pattern) return -1;
  if (!a.pattern && b.pattern) return 1;
  if (a.pattern && b.pattern) return comparePatterns(a.pattern, b.pattern);
  return a.name.localeCompare(b.name);
}

export const comparePatterns = (a, b) => {
  const pathA = new URL(a).pathname;
  const pathB = new URL(b).pathname;

  if (pathA == pathB) return 0;
  if (pathA == '/') return 1;
  if (pathB == '/') return -1;

  const partsA = pathA.split('/');
  const partsB = pathB.split('/');
  if (partsA.length > partsB.length) return -1;
  if (partsB.length > partsA.length) return 1;

  for (let i = 0; i < partsA.length; i++) {
    const partA = partsA[i];
    const partB = partsB[i];
    if (partA != partB) {
      if (partA.startsWith(':')) {
        return 1;
      }
      if (partB.startsWith(':')) {
        return -1;
      }
    }
  }

  return a.localeCompare(b);
}

const check = (url, startUrl) => {
  let u;
  try {
    u = new URL(url);
  } catch {
    return false;
  }

  if (u.origin != new URL(startUrl).origin) {
    return false;
  }

  return true;
}

export const toExample = (pattern) => {
  const url = new URL(pattern);
  const parts = url.pathname.split('/');
  const exampleParts = [];
  let i = 1;
  const alpha = 'abcdefghijklmnopqrstuvwxyz'.split('');
  for (const p of parts) {
    if (p == '*' || p.startsWith(':')) {
      exampleParts.push('val' + alpha[i++]);
    } else {
      exampleParts.push(p);
    }
  }

  url.pathname = exampleParts.join('/');
  return norm(url.toString());
}

const goalPrompt = (layoutString, visited, hint) => `Establish a general map of the site layout. Explore new areas that are likely to contain rich data and content.

Here is the sitemap so far:

== Site Map ==
${layoutString}
== End Site Map ==

You have already visited these links: ${visited.slice(-1000).join('\n')}

Focus on areas that are unexplored.

${hint ? 'Also, take into consideration this hint from the user: ' + hint : ''}
`;
