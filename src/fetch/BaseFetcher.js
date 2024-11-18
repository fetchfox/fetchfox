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

    this.usage.requests++;
    const start = (new Date()).getTime();

    try {
      const cached = await this.getCache(url, options);
      if (cached) {
        logger.debug(`Returning cached ${cached}`);
        this.usage.cached++;
        return cached;
      }

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
        // TODO: Move this code into Document.js, consolidate with options?.presignedUrl
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

          const s3url = await publishToS3(
            doc.html,
            'text/html',
            acl,
            bucket,
            key + '.html');

          logger.debug(`Uploaded HTML to ${s3url}`);

          doc.htmlUrl = s3url;

          if (doc.screenshot) {
            const s3ScreenshotUrl = await publishToS3(
              doc.screenshot,
              'image/png',
              acl,
              bucket,
              key + '.png');

            logger.debug(`Uploaded screenshot to ${s3ScreenshotUrl}`);
            doc.screenshotUrl = s3ScreenshotUrl;
          }
        }

        yield Promise.resolve(doc);
      }

    } finally {
      const took = (new Date()).getTime() - start;
      this.usage.runtime += took;
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
    const outcome = result ? '(hit)' : '(miss)';
    logger.debug(`Fetch cache ${outcome} for ${url} ${result}`);

    if (result) {
      const doc = new Document();
      doc.loadData(result);
      logger.debug(`Fetch cache loaded ${doc}`);
      return doc;
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
