import * as cheerio from 'cheerio';
import { URL } from 'url';
import fs from 'node:fs';

import { logger } from '../log/logger.js';

export const Document = class {
  constructor() {}

  toString() {
    return JSON.stringify(this.dump(), null, 2);
  }

  dump() {
    const data = {
      resp: this.resp,
      contentType: this.contentType,
      body: this.body,
    };
    if (this.req) {
      data.request = this.req;
    }
    return data;
  }

  async save(filename) {
    logger.info(`Save document to ${filename}`);
    return fs.writeFileSync(filename, this.toString());
  }

  async load(filename) {
    logger.info(`Read document from ${filename}`);
  }

  async read(resp, reqUrl, reqOptions) {
    logger.info(`Loading document from response ${resp.url}`);

    this.body = await resp.text();
    this.url = resp.url;

    const respHeaders = {};
    resp.headers.forEach((value, key) => {
      respHeaders[key] = value;
    });
    this.resp = {
      url: resp.url,
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
    const contentType = this.resp.headers['content-type'];
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
    this.requireHtml();

    const $ = cheerio.load(this.html);
    $('style').remove();

    const getText = (root) => {
      return $(root)
        .contents()
        .map((i, el) => {
          if (el.type === 'text') {
            return $(el).text().trim();
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
      const url = new URL($(a).attr('href'), this.url);
      const html = $(a).prop('outerHTML');
      const text = $(a).prop('innerText');
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
