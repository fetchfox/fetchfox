import * as cheerio from 'cheerio';
import { URL } from 'url';

export const Document = class {
  constructor() {}

  async load(resp) {
    this.resp = resp;
    this.body = await resp.text();

    const contentType = this.resp.headers.get('content-type');
    if (contentType.indexOf('text/html') != -1) {
      this.loadHTML();
    }
  }

  loadHTML() {
    this.contentType = 'text/html';
    this.html = this.body;

    this.loadTextFromHTML();
    this.loadLinks();
  }

  loadTextFromHTML() {
    this.requireHTML();

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

  loadLinks() {
    this.requireHTML();

    const links = [];
    let id = 1;
    const $ = cheerio.load(this.html);
    for (const a of $('a')) {
      const url = new URL($(a).attr('href'), this.resp.url);
      const html = $(a).prop('outerHTML');
      const text = $(a).prop('innerText');
      links.push({
        id: id++,
        url: '' + new URL($(a).attr('href'), this.resp.url),
        html: $(a).prop('outerHTML').substr(0, 1000),
        text: $(a).prop('innerText').substr(0, 200),
      });
    }
    this.links = links;
  }

  requireHTML() {
    if (this.contentType != 'text/html') {
      console.error('Can only load links for HTML');
      return;
    }

    if (!this.html) {
      console.error('No HTML loaded');
      return;
    }
  }
}
