import { logger } from '../log/logger.js';
import { URL } from 'whatwg-url';
import { parse } from 'node-html-parser';

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
    const start = (new Date()).getTime();
    this.body = await resp.text();
    const tookRead = (new Date()).getTime() - start;
    logger.debug(`Done reading body for ${this.url}, took ${tookRead/1000} sec`);

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
    const took = (new Date()).getTime() - start;
    logger.info(`Done loading for ${this.url}, took total of ${took/1000} sec`);
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

    const root = parse(this.html);
    
    // Remove unwanted tags by replacing them with placeholders
    ['style', 'script', 'svg'].forEach(tag => {
      root.querySelectorAll(tag).forEach(element => {
        element.replaceWith(`[[${tag} removed]]`);
      });
    });

    // Recursive function to extract text content
    const getText = (node) => {
      if (node.nodeType === 3) { // Text node
                                 const text1 = node.rawText.trim();
        const wrapper = parse(`<span>${text1}</span>`);
        const text2 = wrapper.structuredText.trim();
        return text2;
      } else if (node.nodeType === 1) { // Element node
                                        return node.childNodes.map(getText).join(' ');
      }
      return '';
    };

    this.text = getText(root);
  }

  parseLinks() {
    this.requireHtml();

    const links = [];
    let id = 1;
    const root = parse(this.html);

    root.querySelectorAll('a').forEach(a => {
      const html = a.outerHTML;
      const text = a.text.trim();
      const href = a.getAttribute('href');

      let url;
      try {
        url = new URL(href, this.url);
      } catch (e) {
        logger.warn(`Skipping invalid link: ${this.url} ${html}`);
        return;
      }

      links.push({
        id: id++,
        url: url.toString(),
        html: html.substring(0, 1000),
        text: text.substring(0, 200),
      });
    });

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
