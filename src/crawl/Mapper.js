import { getAI } from '../ai/index.js'
import { norm } from './shared.js ';
import * as prompts from './prompts.js';

export const Mapper = class {
  constructor(options) {
    this.ai = options?.ai || getAI();

    this.urls = {};
    this.patterns = [];
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
    for (const url of Object.keys(this.urls)) {
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

  layoutString(url, depth = 0, depths) {
    const path = this.toPath(norm(url));
    const paths = this.paths;

    if (!depths) {
      depths = {};
      const measure = (path, depth) => {
        depths[path.name] = (
          depths[path.name] === undefined
          ? depth 
          : Math.min(depths[path.name], depth)
        );

        for (const to of (paths[path.name]?.to || [])) {
          // console.log('to', to);
          if (depths[to.name] === undefined || depths[to.name] > depth) {
            measure(to, depth + 1);
          }
        }
      }

      measure(path, 0);
    }

    const indent = (n) => '\t'.repeat(n);
    let s = indent(depth) + path.name + '\n';

    const tos = [...(paths[path.name]?.to || [])].sort(comparePaths);

    // console.log('paths', paths);
    // console.log('[root:\thttps://pokemondb.net/]', paths['[root:\thttps://pokemondb.net/]']?.to);
    // console.log('urls[root:\thttps://pokemondb.net/]',
    //             this.urls['[root:\thttps://pokemondb.net/]']?.to);
    // console.log('patterns', this.patterns);

    // console.log(
    //   'ABILITY paths[root:\thttps://pokemondb.net/]',
    //   this.paths['[root:\thttps://pokemondb.net/]']?.to.filter(it => it.name.includes('ability')));

    // console.log(
    //   'ABILITY urls[root:\thttps://pokemondb.net/]',
    //   this.urls['https://pokemondb.net/']?.to.filter(it => it.includes('ability')));

    // const p1 = this.toPath('https://pokemondb.net/ability');
    // const p2 = this.toPath('https://pokemondb.net/ability/poison-puppeteer ');
    // const p3 = this.toPath('https://pokemondb.net/ability/supersweet-syrup');

    // console.log('p1', p1);
    // console.log('p2', p2);
    // console.log('p3', p3);

    for (const to of tos) {
      // console.log('to:', path.name, '->', to.name);

      if (depths[to.name] == depth + 1) {
        s += this.layoutString(to.name, depth + 1, depths);
      } else if (to.pattern) {
        s += indent(depth + 1) + to.name + '\n';
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
    const context = { layout: this.layoutString(url) };
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
