import CryptoJS from 'crypto-js';
import { logger } from '../log/logger.js';
import { Document } from '../document/Document.js';
import { publishToS3 } from '../export/publish.js';
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

    const cached = await this.getCache(url, options);
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

        // TODO: Move this code into Document.js, consolidate with options?.presignedUrl
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

          const s3Url = await publishToS3(
            doc.html, 'text/html', acl, bucket, key + '.html');
          logger.debug(`Uploaded HTML to ${s3Url} acl=${acl}`);
          doc.htmlUrl = s3Url;

          if (doc.screenshot) {
            logger.debug(`Uploaded screenshot to ${s3ScreenshotUrl} acl=${acl}`);
            const s3ScreenshotUrl = await publishToS3(
              doc.screenshot, 'image/png', acl, bucket, key + '.png');
            doc.screenshotUrl = s3ScreenshotUrl;
          }
        }

        docs.push(doc);
        yield Promise.resolve(doc);
      }

    } finally {
      const took = (new Date()).getTime() - start;
      this.usage.runtime += took;

      if (docs.length) {
        const all = await Promise.all(docs.map(doc => doc.dump()));
        this.setCache(url, options, all);
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
    logger.debug(`Fetch cache ${outcome} for ${url} ${result}`);

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
    logger.debug(`Set fetch cache for ${url} to "${('' + val).substr(0, 32)}..."`);
    return this.cache.set(key, val, 'fetch');
  }
}
