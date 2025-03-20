import { logger } from '../log/logger.js';
import * as prompts from './prompts.js';
import { parse } from 'node-html-parser';
import pretty from 'pretty';

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
      text: this.text,
      selectHtml: this.selectHtml,
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
      delete data.body;
      delete data.html;
      delete data.text;
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
    this.text = data.text;
    this.selectHtml = data.selectHtml;
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

    const took = (new Date()).getTime() - start;
    logger.info(`${this} Done loading for ${this.url}, took total of ${took/1000} sec, got ${this.body.length} bytes`);
  }

  // TODO: Move this to Transformer.js
  async learn(ai, template) {
    const format = {};
    format['_analysis'] = 'Analysis in 10-200 words of how to select the relevant data';
    format['_container'] = 'CSS selector for elements enclosing answers to each question, if available';
    for (const key of Object.keys(template)) {
      format[key] = `CSS selector for ${key}`;
    }
    format['_modals'] = 'List of CSS selectors for elements to click in order to clear any modals if present'
    format['_paginate'] = 'CSS selector for element to click to get to the next page if possible';
    format['_shared'] = 'List of keys where the value should be reused on subsequent entries';
    format['_hint'] = 'Any helpful information for answering the questions';
    format['_confidence'] = 'Confidence in overall response effectiveness from 0-100';

    logger.info('format', format);

    const context = {
      html: this.html,
      template: JSON.stringify(template, null, 2),
      format: JSON.stringify(format, null, 2),
    }

    const { prompt } = await prompts.learnCSS.renderCapped(
      context, 'html', ai.advanced);

    logger.debug(prompt);
    const answer = await ai.advanced.ask(prompt, { format: 'json' });
    logger.info('answer', answer.partial);
    const fields = Object.keys(answer.partial).filter(k => !k.startsWith('_'));
    if (answer.partial._combined) {
      fields.push(answer.partial._combined)
    }
    const selectors = fields.map(key => answer.partial[key]);
    logger.info('selectors', selectors);

    const root = parse(this.html);
    const matches = [];
    for (const f of fields) {
      const s = answer.partial[f];
      const matches = root.querySelectorAll(s);
      for (const node of matches) {
        if (!node.field) {
          node.field = f;
          node.extraFields = [];
        } else {
          node.extraFields.push(f);
        }
      }
      matches.push(...root.querySelectorAll(s));
    }

    const matchingNodes = (node) => {
      const nodes = [];
      if (node.field) {
        nodes.push(node);
      }

      for (const child of node.childNodes) {
        nodes.push(...matchingNodes(child));
      }

      return nodes;
    }
    const include = matchingNodes(root);

    const sharedFields = fields.filter(f => (answer.partial._shared ?? []).includes(f));
    const normalFields = fields.filter(f => !sharedFields.includes(f));

    const prune = (node) => {
      let kept = !!node.field;
      for (const child of node.childNodes) {
        if (prune(child)) {
          kept = true;
        } else {
          // if HTML element
          if (child.tagName) {
            child.remove();
          }
        }
      }
      if (kept) {
        return node;
      } else {
        return null;
      }
    }

    const collect = (node) => {
      const kept = !!node.field;
      const keep = [];
      for (const child of node.childNodes) {
        keep.push(...collect(child));
      }

      if (kept) {
        return [node];
      } else {
        return keep;
      }
    }

    const addAll = (node) => {
      // collect descendants to include
      const include = [];
      let current = collect(node);
      while (current.length > 0) {
        include.push(...current);
        let children = []
        for (n of current) {
          children.push(...n.childNodes.map(n => collect(n)));
        }
        current = children;
      }

      const obj = {};
      for (const el of include) {
        const value = el.toString();
        const fields = [el.field, ...el.extraFields];
        for (const field of fields) {
          // Add value(s) to current object
          if (field in obj) {
            if (!Array.isArray(obj[field])) {
              obj[field] = [obj[field]];
            }
            obj[field].push(value);
          } else {
            obj[field] = value;
          }
        }
      }
      return obj;
    }

    const toObj = (include) => {
      const result = [];
      let obj = {};
      let context = {};
      let prev = null;

      for (const el of include) {
        const fields = [el.field, ...el.extraFields];
        for (const field of fields) {
          if (fields.includes('_container')) {
            result.push(addAll(el));
            continue;
          } else {
            // Otherwise, treat as sequential
            const value = el.toString();

            // Handle shared fields (e.g., generation as a header)
            if (sharedFields.includes(field)) {
              if (Object.keys(obj).length != 0) {
                result.push({ ...context, ...obj });
              }
              obj = {};
              context[field] = value;
              prev = null;
              continue; // Wait for a normal field to add to the object
            }

            // Check if this field starts a new object
            if (normalFields.includes(field) && field in obj && prev != field) {
              result.push({ ...context, ...obj });
              obj = {};
            }

            // Add value(s) to current object
            if (field in obj) {
              if (!Array.isArray(obj[field])) {
                obj[field] = [obj[field]];
              }
              obj[field].push(value);
            } else {
              obj[field] = value;
            }
            prev = field;
          }
        }
      }

      // Add last object if incomplete but has data
      if (Object.keys(obj).length > 0) {
        result.push({ ...context, ...obj });
      }

      return result;
    }

    // This modifies the parsed root
    const pruned = prune(root);
    const obj = toObj(include);

    const html = pruned.toString();

    this.learned = {
      format,
      response: answer.partial,
      analysis: answer.partial.analysis,
      hint: pretty(answer.partial.hint, { ocd: true }),
    }

    this.obj = obj;
    console.log(pretty(html, {ocd: true}));
    this.selectHTML = pretty(html, {ocd: true});
    return {
      format,
      response: answer.partial,
      obj,
      html,
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
