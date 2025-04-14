import { getAI } from '../ai/index.js'
import { getFetcher } from '../fetch/index.js'
import { PriorityQueue } from './PriorityQueue.js'
import { norm } from './shared.js ';
import * as prompts from './prompts.js';

export const Mapper = class {
  constructor(options) {
    this.ai = options?.ai || getAI();
    this.fetcher = options?.fetcher || getFetcher();

    this._urls = {};
    this.patterns = [];

    this._memo = {};
  }

  get urls() {
    return Object.keys(this._urls);
  }

  async run(rootUrl, options) {
    const maxIterations = options?.maxIterations ?? 10;
    const onIteration = options?.onIteration ? options?.onIteration : () => {};

    const pq = new PriorityQueue((url) => this.score(url));
    pq.add(rootUrl);

    for (let i = 0; i < maxIterations && !pq.empty; i++) {
      const link = pq.shift();
      const doc = await this.fetcher.first(link.url);

      for (const found of doc.links) {
        if (!check(found.url, link.url)) {
          continue;
        }
        this.connect(link.url, found.url);
        pq.add(found.url);
      }

      await this.learn(rootUrl);
      await onIteration();
    }
  }

  score(url) {
    const path = this.toPath(url);
    if (path.pattern) {
      return 1;
    } else {
      return 2;
    }
  }
  
  distance(url, targetPattern, n = 0, seen = {}) {
    const key = `${url}->${targetPattern}`;
    if (this._memo[key]) {
      return this._memo[key];
    }

    const path = this.toPath(url);
    if (seen[path.name]) {
      return;
    }
    seen[path.name] = true;

    const example = toExample(targetPattern);
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
        d = this.distance(toExample(to.pattern), targetPattern, n + 1, seen);
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
      if (url.match(new RegExp(pattern.regex))) {
        return pattern;
      }
    }
    return { url, name: url };
  }

  get paths() {
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
    return out;
  }

  layoutString(urls, depth = 0, depths) {
    const paths = this.paths;
    if (!urls) {
      urls = Object.keys(this._urls).filter(it => Boolean(this._urls[it].to?.length));
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
      this._urls[it] ||= {
        to: [],
        from: [],
      };
    });

    this._urls[src].to.push(dst);
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
  for (const p of parts) {
    if (p == '*' || p.startsWith(':')) {
      exampleParts.push('val' + (i++));
    } else {
      exampleParts.push(p);
    }
  }

  url.pathname = exampleParts.join('/');
  return norm(url.toString());
}
