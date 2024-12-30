import { logger } from '../log/logger.js';
import { Timer } from '../log/timer.js';
import { URL } from 'whatwg-url';
import { parse } from 'node-html-parser';

// TODO: refactor Document entirely
export const Document = class {
  constructor() {}

  toString() {
    return `[Document: ${this.url} ${(this.html || '').length} bytes]`;
  }

  async dump(options) {
    const data = {
      url: this.url,
      body: this.body,
      html: this.html,
      htmlUrl: this.htmlUrl,
      screenshotUrl: this.screenshotUrl,
      text: this.text,
      links: this.links,
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
      delete data.body;
      delete data.html;
      delete data.text;
      delete data.links;
    }
    if (this.req) {
      data.req = this.req;
    }
    return data;
  }

  async uploadHtml(presignedUrl) {
    await fetchRetry(presignedUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'text/html' },
      body: this.html,
    });
    this.htmlUrl = presignedUrl.replace(/\?.*$/, '');
    logger.debug(`${this} Uploaded HTML to ${this.htmlUrl}`);
    return this.htmlUrl;
  }

  async loadData(data) {
    this.url = data.url;
    this.body = data.body;
    this.html = data.html;
    this.htmlUrl = data.htmlUrl;
    this.text = data.text;
    this.screenshotUrl = data.screenshotUrl;
    this.links = data.links || [];
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
      this.body = await resp.text();
    } catch (e) {
      logger.error(`${this} Error reading body: ${e}`);
      throw e;
    }
    const tookRead = (new Date()).getTime() - start;
    logger.debug(`${this} Done reading body for ${this.url}, took ${tookRead/1000} sec and got ${this.body.length} bytes`);

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

    this.parse();
    const took = (new Date()).getTime() - start;
    logger.info(`${this} Done loading for ${this.url}, took total of ${took/1000} sec, got ${this.body.length} bytes`);
  }

  parse() {
    const timer = new Timer();
    timer.push('Document.parse');
    const contentType = (
      this.contentType ||
      (this.resp?.headers || {})['content-type'] ||
      'text/plain'
    );
    if (this.html || contentType.indexOf('text/html') != -1) {
      this.parseHtml(null, { timer });
    }
    timer.pop();
  }

  parseHtml(selector, options) {
    const timer = options?.timer || new Timer();
    timer.push('Document.parseHtml');

    this.contentType = 'text/html';

    let html = this.html || this.body;

    if (selector) {
      let selected = ''
      const root = parse(html);
      root.querySelectorAll(selector).forEach(el => {
        selected += el.outerHTML; // Append the outer HTML of each element to selected.
      });
      html = selected;
    }

    this.html = html;

    this.parseTextFromHtml();
    this.parseLinks();

    timer.pop();
  }

  parseTextFromHtml(options) {
    const timer = options?.timer || new Timer();
    timer.push('Document.parseTextFromHtml');

    this.requireHtml();

    const root = parse(this.html);
    
    ['style', 'script', 'svg'].forEach(tag => {
      root.querySelectorAll(tag).forEach(el => {
        el.replaceWith(`[[${tag} removed]]`);
      });
    });

    const getText = (node) => {
      if (node.nodeType == 3) {
        const text1 = node.rawText.trim();
        const wrapper = parse(`<span>${text1}</span>`);
        const text2 = wrapper.structuredText.trim();
        return text2;
      } else if (node.nodeType == 1) {
        return node.childNodes.map(getText).join(' ');
      }
      return '';
    };

    this.text = getText(root);

    timer.pop();
  }

  parseLinks(css, options) {
    const timer = options?.timer || new Timer();
    timer.push('Document.parseLinks');

    this.requireHtml();

    const links = [];
    const seen = {};
    let id = 1;
    const root = parse(this.html);

    let els = [];
    if (css) {
      root.querySelectorAll(css).forEach(el => els.push(el));
    } else {
      els = [root];
    }

    for (const el of els) {
      const as = [];
      if (el.tagName == 'A') {
        as.push(el);
      }

      el.querySelectorAll('a').forEach(a => {
        as.push(a);
      });

      for (const a of as) {
        const html = a.outerHTML;
        const text = a.text.trim();
        const href = a.getAttribute('href');

        if (href == undefined) {
          continue;
        }

        let url;
        try {
          url = new URL(href, this.url);
        } catch (e) {
          logger.warn(`${this} Skipping invalid link: ${this.url} href=${href} url=${this.url} html=${html.substr(0, 40)}: ${e}`);
          continue;
        }

        const urlStr = url.toString();

        if (seen[urlStr]) continue;
        seen[urlStr] = true;

        links.push({
          id: id++,
          url: urlStr,
          html: html.substring(0, 1000),
          text: text.substring(0, 200),
        });
      }
    }

    this.links = links;

    timer.pop();
  }

  requireHtml() {
    if (this.contentType != 'text/html') {
      logger.error('${this} Can only parse links for HTML');
      return;
    }

    if (!this.html) {
      logger.error('${this} No HTML');
      return;
    }
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
