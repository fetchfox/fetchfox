import CryptoJS from 'crypto-js';
import { logger } from '../log/logger.js';
import { Document } from '../document/Document.js';
// import { publishToS3 } from '../export/publish.js';
import { presignS3 } from './util.js';
import ShortUniqueId from 'short-unique-id';
import PQueue from 'p-queue';

export const BaseFetcher = class {
  constructor(options) {
    this.cache = options?.cache;
    this.queue = [];
    this.usage = {
      requests: 0,
      cached: 0,
      runtime: 0,
    };
    this.q = new PQueue({
      concurrency: options?.concurrency || 5,
      intervalCap: options?.intervalCap || 3,
      interval: options?.interval || 3000,
    });

    this.s3 = options?.s3;
    this.css = options?.css;
  }

  toString() {
    return `[${this.constructor.name}]`;
  }

  async first(target, options) {
    for await (const doc of this.fetch(target, options)) {
      return doc;
    }
  }

  async *fetch(target, options) {
    logger.info(`Fetch ${target} with ${this}`);

    let url;

    if (typeof target == 'string') {
      url = target;
    } else if (typeof target.url == 'string') {
      url = target.url;
    }

    // Pull out options that affect caching
    const cacheOptions = {
      css: options?.css,
    };

    const cached = await this.getCache(url, cacheOptions);
    if (cached) {
      logger.debug(`Returning cached ${cached}`);
      this.usage.cached++;
      for (const doc of cached) {
        yield Promise.resolve(doc);
      }
      return;
    }

    this.usage.requests++;
    const start = (new Date()).getTime();

    const docs = [];

    try {
      try {
        new URL(url);
      } catch (e) {
        return null;
      }

      const exclude = ['javascript:', 'mailto:'];
      for (const e of exclude) {
        if (url.indexOf(e) == 0) {
          return null;
        }
      }

      logger.debug(`Adding to fetch queue: ${url}`);
      const p = await this.q.add(() => {
        logger.debug(`Queue is starting fetch of: ${url}`);
        return this._fetch(url, options);
      });
      logger.debug(`Fetch queue has ${this.q.size} requests`);

      for await (const doc of p) {
        logger.debug(`Should we filter for CSS? ${options?.css}`);
        if (options?.css) {
          doc.parseHtml(options.css);
        }

        logger.debug(`Fetcher s3 config: ${JSON.stringify(this.s3)}`);
        if (this.s3) {
          const bucket = this.s3.bucket;
          const keyTemplate = this.s3.key || 'fetchfox-docs/{id}/{url}';
          const acl = this.s3.acl || '';
          const id = new ShortUniqueId({
            length: 10,
            dictionary: 'alphanum_lower',
          }).rnd();
          const cleanUrl = url.replace(/[^A-Za-z0-9]+/g, '-');
          const key = keyTemplate
            .replaceAll('{id}', id)
            .replaceAll('{url}', cleanUrl);

          const presignedUrl = await presignS3({
            bucket, key, contentType: 'text/html', acl });

          await doc.uploadHtml(presignedUrl);
        }

        docs.push(doc);
        yield Promise.resolve(doc);
      }

    } finally {
      const took = (new Date()).getTime() - start;
      this.usage.runtime += took;

      if (docs.length) {
        const all = await Promise.all(docs.map(doc => doc.dump()));
        this.setCache(url, cacheOptions, all);
      }
    }
  }

  cacheKey(url, options) {
    const hash = CryptoJS
      .SHA256(JSON.stringify({ url, options }))
      .toString(CryptoJS.enc.Hex)
      .substr(0, 16);
    return `fetch-${this.constructor.name}-${url.replaceAll(/[^A-Za-z0-9]+/g, '-').substr(0, 120)}-${hash}`;
  }

  async getCache(url, options) {
    if (!this.cache) return;

    const key = this.cacheKey(url, options);
    const result = await this.cache.get(key);
    const hit = Array.isArray(result) && result.length > 0;
    const outcome = hit ? '(hit)' : '(miss)';
    logger.debug(`xyz Fetch cache ${outcome} for ${url} ${result} key=${key} options=${JSON.stringify(options)}`);

    if (hit) {
      const docs = [];
      for (const data of result) {
        const doc = new Document();
        doc.loadData(data);
        docs.push(doc);
      }
      logger.debug(`Fetch cache loaded ${docs.map(d => ''+d).join(', ')}`);
      return docs;
    } else {
      return null;
    }
  }

  async setCache(url, options, val) {
    if (!this.cache) return;
    const key = this.cacheKey(url, options);
    logger.debug(`xyz Set fetch cache for ${url} to "${(JSON.stringify(val)).substr(0, 32)}..." key=${key} options=${JSON.stringify(options)}`);
    return this.cache.set(key, val, 'fetch');
  }
}
