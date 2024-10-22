import { logger } from '../log/logger.js';
import * as cheerio from 'cheerio';
import { URL } from 'whatwg-url';

export const Document = class {
  constructor() {}

  toString() {
    return `[Document: ${this.url}]`;
  }

  dump() {
    const data = {
      url: this.url,
      body: this.body,
      html: this.html,
      text: this.text,
      links: this.links,
      resp: this.resp,
      contentType: this.contentType,
    };
    if (this.req) {
      data.req = this.req;
    }
    return data;
  }

  loadData(data) {
    this.url = data.url;
    this.body = data.body;
    this.html = data.html;
    this.text = data.text;
    this.links = data.links || [];
    this.resp = data.resp;
    this.contentType = data.contentType;
    if (data.req) {
      this.req = data.req;
    }
  }

  async read(resp, reqUrl, reqOptions) {
    this.url = typeof resp.url == 'function' ? resp.url() : resp.url;
    logger.info(`Loading document from response ${this.url}`);
    this.body = await resp.text();

    let respHeaders = {};
    if (typeof resp.headers == 'function') {
      respHeaders = resp.headers();
    } else {
      resp.headers.forEach((value, key) => {
        respHeaders[key] = value;
      });
    }

    this.resp = {
      url: this.url,
      status: resp.status,
      statusText: resp.statusText,
      headers: respHeaders,
    };

    if (reqUrl) {
      this.req = { url: reqUrl };
      if (reqOptions) this.req.options = reqOptions;
    }

    this.parse();
  }

  parse() {
    const contentType = this.resp?.headers['content-type'] || 'text/plain';
    if (contentType.indexOf('text/html') != -1) {
      this.parseHtml();
    }
  }

  parseHtml() {
    this.contentType = 'text/html';
    this.html = this.body;

    this.parseTextFromHtml();
    this.parseLinks();
  }

  parseTextFromHtml() {
    // TODO: This function is slow, find an alternate library
    this.requireHtml();

    const $ = cheerio.load(this.html);
    for (const tag in ['style', 'script', 'svg']) {
      $(tag).replaceWith(`[[${tag} removed]]`);
    }

    const getText = (root) => {
      return $(root)
        .contents()
        .map((i, el) => {
          if (el.type === 'text') {
            // If there is no text in a node, cheerio sometimes includes HTML as
            // text. I'm not sure why, but to solve this, do a second pass by
            // wrapping the first result in <span>. This eliminates the problem.
            // TODO: Investigave and see if there is a better solution
            const text1 = $(el).text().trim();
            const text2 = $(`<span>${text1}</span>`).text().trim();
            return text2;
          } else if (el.type === 'tag') {
            return getText(el);
          }
          return '';
        })
        .get()
        .join(' ');
    };

    this.text = getText($('*'));
  }

  parseLinks() {
    this.requireHtml();

    const links = [];
    let id = 1;
    const $ = cheerio.load(this.html);
    for (const a of $('a')) {
      const html = $(a).prop('outerHTML');
      const text = $(a).prop('innerText');
      const href = $(a).attr('href');

      let url;
      try {
        url = new URL(href, this.url);
      } catch (e) {
        logger.warn(`Skipping invalid link: ${this.url} ${html}`);
        continue;
      }

      links.push({
        id: id++,
        url: '' + new URL($(a).attr('href'), this.url),
        html: $(a).prop('outerHTML').substr(0, 1000),
        text: $(a).prop('innerText').substr(0, 200),
      });
    }
    this.links = links;
  }

  requireHtml() {
    if (this.contentType != 'text/html') {
      logger.error('Can only parse links for HTML');
      return;
    }

    if (!this.html) {
      logger.error('No HTML');
      return;
    }
  }
}
