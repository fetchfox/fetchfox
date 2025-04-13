import { getAI } from '../ai/index.js'
import { getFetcher } from '../fetch/index.js'
import { PriorityQueue } from './PriorityQueue.js'
import { norm } from './shared.js ';
import * as prompts from './prompts.js';

export const Mapper = class {
  constructor(options) {
    this.ai = options?.ai || getAI();
    this.fetcher = options?.fetcher || getFetcher();

    this.urls = {};
    this.patterns = [];
  }

  async map(rootUrl, options) {
    const maxIterations = options?.maxIterations || 10;
    const onIteration = options?.onIteration ? options?.onIteration : () => {};

    const pq = new PriorityQueue((url) => this.score(url));
    // urls.forEach(it => pq.add(it));
    pq.add(rootUrl);

    for (let i = 0; i < maxIterations && !pq.empty; i++) {
      const link = pq.shift();
      const doc = await this.fetcher.first(link.url);
      console.log('got doc:' + doc);

      for (const found of doc.links) {
        // console.log('found', found.url, link.url);
        if (!check(found.url, link.url)) {
          continue;
        }
        // console.log('connect', found.url, link.url);

        this.connect(link.url, found.url);
        pq.add(found.url);
      }

      await this.learn(rootUrl);
      onIteration();
    }
  }

  score(url) {
    // console.log('mapper score', url);
    const path = this.toPath(url);
    if (path.pattern) {
      return 1;
    } else {
      return 2;
    }
  }

  toPath(url) {
    url = norm(url);

    for (const pattern of this.patterns) {
      // console.log('-->', url);
      if (url.match(new RegExp(pattern.regex))) {
        return pattern;
      }
    }
    return { url, name: url };
  }

  get paths() {
    const out = {};
    const urls = Object.keys(this.urls);
    for (const url of urls) {
      const path = this.toPath(url);

      if (!out[path.name]) {
        out[path.name] = { to: [] };
      }

      const seen = {};
      for (const to of (this.urls[url]?.to || [])) {
        const pathTo = this.toPath(to);
        const exists = out[path.name].to.filter(it => it.name == pathTo.name).length
        if (exists) {
          continue;
        }
        out[path.name].to.push(pathTo);
      }
    }
    return out;
  }

  layoutString(urls, depth = 0, depths) {
    const paths = this.paths;
    if (!urls) {
      urls = Object.keys(this.urls).filter(it => Boolean(this.urls[it].to?.length));
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

      s += indent(depth) + path.name + '\n';

      const tos = [...(paths[path.name]?.to || [])].sort(comparePaths);
      for (const to of tos) {
        if (depths[to.name] == depth + 1) {
          s += this.layoutString([to.name], depth + 1, depths);
        } else if (to.pattern) {
          s += indent(depth + 1) + to.name + '\n';
        }
      }
    }

    return s;
  }

  connect(src, dst) {
    src = norm(src);
    dst = norm(dst);

    [src, dst].map(it => {
      this.urls[it] ||= {
        to: [],
        from: [],
      };
    });

    this.urls[src].to.push(dst);
  }

  async learn(url) {
    const context = { layout: this.layoutString([url]) };
    const { prompt } = await prompts.urlPatterns.renderCapped(
      context, 'layout', this.ai);

    this.patterns = [];
    const gen = this.ai.stream(prompt, { format: 'jsonl' });
    for await (const { delta } of gen) {
      const pattern = delta.pattern.replace(/\/$/, '');
      console.log('delta pattern ->', pattern);
      this.patterns.push({ ...delta, pattern, name: `[${delta.name}:\t${pattern}]` });
    }

    this.patterns.sort((a, b) => comparePatterns(a.pattern, b.pattern));
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
