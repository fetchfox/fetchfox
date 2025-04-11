import pretty from 'pretty';
import { logger } from '../log/logger.js';
import { parse } from 'node-html-parser';
import TurndownService from 'turndown';


export const Document = class {
  constructor() {}

  toString() {
    return `[Document: ${this.url} ${(this.html || '').length} bytes]`;
  }

  get html() {
    if (!this._html) {
      return '';
    }

    if (!this._cleanHtml) {
      const root = parse(this._html);

      const visit = (node) => {
        if (node.nodeType == 1) {
          const tagName = (node.tagName || '').toLowerCase();

          if (['script', 'style', 'svg'].includes(tagName)) {
            return null;
          }

          if (node.attributes) {
            Object.keys(node.attributes).forEach(attr => {
              const max = 1000;
              const val = node.attributes[attr] || '';
              if (val.length > max) {
                node.attributes[attr] = val.substring(0, max);
              }
            });
          }

          const children = node.childNodes || [];
          if (children.length) {
            node.childNodes = children
              .map(visit)
              .filter(Boolean);
          }
        }

        return node;
      };

      this._cleanHtml = pretty(
        visit(root).toString() || '',
        { ocd: true }
      );
    }

    return this._cleanHtml;
  }

  get text() {
    if (!this._text) {
      const root = parse(this._html);
      this._text = trim(root.text);
    }

    return this._text;
  }

  get linksHtml() {
    if (!this._linksHtml) {
      const root = parse(this._html);

      const visit = (node) => {
        if (node.nodeType == 3) { // TEXT_NODE
          return node.rawText;
        }

        const tagName = (node.tagName || '').toLowerCase();

        const href = node.getAttribute('href');
        const children = node.childNodes || [];
        const inner = children.map(visit).join('');

        if (tagName == 'a' && href) {
          return `<a href="${href}">${inner}</a>`;
        } else {
          return inner;
        }
      };

      this._linksHtml = trim(visit(root));
    }

    return this._linksHtml;
  }

  get markdown() {
    if (!this._markdown) {
      var td = new TurndownService();
      this._markdown = td.turndown(this.html);
    }

    return this._markdown;
  }

  get metadata() {
    if (!this._metadata) {
      const root = parse(this._html);

      this._metadata = {};

      const meta = root.querySelectorAll('meta');

      for (const tag of meta) {
        const name = tag.getAttribute('name');
        const content = tag.getAttribute('content');
        const property = tag.getAttribute('property');
        const key = name || property;
        if (key && content) {
          this._metadata[key] = content;
        }
      }

      for (const tag of ['title', 'h1']) {
        const el = root.querySelector(tag);
        if (el) {
          this._metadata[tag] = el.text;
        }
      }
    }

    return this._metadata;
  }

  get links() {
    if (!this._links) {
      const root = parse(this._html);
      const links = [];
      const seen = {};
      for (const a of root.querySelectorAll('a')) {
        const href = a.getAttribute('href');
        if (!href) continue;
        let url;
        try {
          url = new URL(href, this.url);
        } catch (e) {
          logger.debug(`${this} Invalid href ${href}, skip:  ${e}`)
        }
        const u = url.toString();
        if (seen[u]) continue;
        seen[u] = true;
        links.push({ url: u });
      }
      this._links = links;
    }

    return this._links;
  }

  async dump(options) {
    const data = {
      url: this.url,
      body: this.body,
      html: this._html,
      htmlUrl: this.htmlUrl,
      screenshotUrl: this.screenshotUrl,
      resp: this.resp,
      contentType: this.contentType,
    };

    if (options?.presignedUrl) {
      logger.info(`${this} Dumping to presigned URL ${options?.presignedUrl}`);
      let htmlUrl;
      try {
        htmlUrl = await this.uploadHtml(options.presignedUrl);
        data.htmlUrl = htmlUrl;
        logger.debug(`${this} Uploaded document to presigned URL`);
      } catch (e) {
        logger.error(`${this} Error uploading HTML to presigned URL: ${e}`);
      }
      delete data._html;
      delete data.text;
    }
    if (this.req) {
      data.req = this.req;
    }
    return data;
  }

  async loadData(data) {
    this.url = data.url;

    this._html = data.html;
    this._cleanHtml = null;

    this.htmlUrl = data.htmlUrl;
    this.screenshotUrl = data.screenshotUrl;
    this.resp = data.resp;
    this.contentType = data.contentType;
    if (data.req) {
      this.req = data.req;
    }

    if (data.htmlUrl) {
      logger.debug(`${this} Loading HTML url ${data.htmlUrl}`);
      try {
        const resp = await fetchRetry(data.htmlUrl);
        await this.read(resp, null, null, data);
      } catch (e) {
        logger.error(`${this} Error loading HTML from ${data.htmlUrl}: ${e}`);
        throw e;
      }
    }
  }

  // TODO: tech debt, refactor arguments to this method
  async read(resp, reqUrl, reqOptions, options) {
    if (options?.url) {
      this.url = options?.url;
    } else {
      this.url = typeof resp.url == 'function' ? resp.url() : resp.url;
    }
    logger.info(`${this} Loading document from response ${this.url}`);
    const start = (new Date()).getTime();
    try {
      this._html = await resp.text();
    } catch (e) {
      logger.error(`${this} Error reading html: ${e}`);
      throw e;
    }
    const tookRead = (new Date()).getTime() - start;
    logger.debug(`${this} Done reading html for ${this.url}, took ${tookRead/1000} sec and got ${this._html.length} bytes`);

    let respHeaders = {};
    if (typeof resp.headers == 'function') {
      respHeaders = resp.headers();
    } else if (resp.headers?.forEach) {
      resp.headers.forEach((value, key) => {
        respHeaders[key] = value;
      });
    } else if (typeof resp.headers == 'object') {
      respHeaders = resp.headers;
    }

    this.resp = {
      url: this.url,
      status: typeof resp.status == 'function' ? resp.status() : resp.status,
      statusText: typeof resp.statusText == 'function' ? resp.statusText() : resp.statusText,
      headers: respHeaders,
    };

    if (reqUrl) {
      this.req = { url: reqUrl };
      if (reqOptions) this.req.options = reqOptions;
    }

    const took = (new Date()).getTime() - start;
    logger.info(`${this} Done loading for ${this.url}, took total of ${took/1000} sec, got ${this._html.length} bytes`);
  }

  async uploadHtml(presignedUrl) {
    await fetchRetry(presignedUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      body: this._html,
    });
    this.htmlUrl = presignedUrl.replace(/\?.*$/, '');
    logger.debug(`${this} Uploaded HTML to ${this.htmlUrl}`);
    return this.htmlUrl;
  }
}

async function fetchRetry(url, options={}, retries=3, delay=4000) {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const resp = await fetch(url, options);
      return resp;
    } catch (e) {
      lastError = e;
      if (attempt < retries) {
        const thisDelay = (attempt + 1) * delay;
        logger.warn(`Retrying... attempt ${attempt + 1} delay=${thisDelay}: ${e}`);
        await new Promise((ok) => setTimeout(ok, attempt * thisDelay));
      }
    }
  }

  throw new Error(`Failed after ${retries + 1} attempts: ${lastError.message}`);
}

const trim = (text) => text
  .replace(/\n\s+\n/g, '\n')
  .replace(/\n+/g, '\n');
