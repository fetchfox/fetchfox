import path from 'path';
import fs from 'fs';

import { createHash } from 'crypto';
import * as cheerio from 'cheerio';
import { URL } from 'url';

import { logger } from '../log/logger.js';

export const Document = class {
  constructor() {}

  toString() {
    return `[Document: ${this.resp?.url}]`;
  }

  dump() {
    const data = {
      url: this.url,
      body: this.body,
      resp: this.resp,
      contentType: this.contentType,
    };
    if (this.req) {
      data.req = this.req;
    }
    return data;
  }

  async load(filename) {
    logger.info(`Read document from ${filename}`);

    const resp = fs.readFileSync(filename, 'utf-8');
    const data = JSON.parse(resp);

    this.url = data.url;
    this.body = data.body;
    this.resp = data.resp;
    this.contentType = data.contentType;
    if (data.req) {
      this.req = data.req;
    }

    this.parse();
  }

  generateFilename() {
    const { hostname, pathname } = new URL(this.resp?.url);
    const hash = createHash('sha256')
      .update(JSON.stringify(this.dump()))
      .digest('hex');
    return `doc-${hostname}${pathname.replaceAll(/[^A-Za-z0-9]+/g, '-')}-${hash.substr(0, 10)}.json`;
  }

  save(dest) {
    if (!dest) {
      dest = this.generateFilename();
    }

    const stat = fs.statSync(dest);
    if (stat.isDirectory()) {
      dest = path.join(dest, this.generateFilename());
    }
    
    logger.info(`Save document to ${dest}`);
    fs.writeFileSync(
      dest,
      JSON.stringify(this.dump(), null, 2));

    return dest;
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
