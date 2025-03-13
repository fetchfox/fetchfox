import { NotFoundError } from 'openai';
import { logger } from '../log/logger.js';
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

  async learn(ai, template) {

    const format = {};
    for (const key of Object.keys(template)) {
      format[key] = `css selector for ${key}`;
    }
    format.combined = `css selector for combined data that encapsulates what the user is asking for`;
    format._shared = `list of fields where a single value corresponds to multiple entries`;

    const prompt = `Given some HTML, give me the CSS selector to select all the elements related to what the user is scraping.  For now do not use descendant selectors.

If there is a field where a single parsed value is shared by multiple entries, add it to a list of field name under the "_shared" key.

>>> Page HTML is:
${this.html.substring(0, 100000)}

>>> The user is scraping:
${JSON.stringify(template, null, 2)}

>>> Respond in JSON format:
${JSON.stringify(format, null, 2)}


Respond ONLY in JSON, your response will be machine parsed using JSON.parse()
`;
    console.log('prompt', prompt);

    const answer = await ai.ask(prompt, { format: 'json' });
    console.log('answer', answer);

    let parsed;
    try {
      parsed = answer.partial;
    } catch (e) {
      return false;
    }
    const selectors = Object.fromEntries(
      Object.entries(parsed).filter(([key]) => key != '_shared')
        .map(([key, desc]) => [key, desc])
    );
    const root = parse(this.html);

    // Main function to extract structured data from HTML
    function extractFields(root, parsed) {
      // Template with optional 'shared' field
      const selectors = Object.fromEntries(
        Object.entries(parsed).filter(([key]) => key !== '_shared')
      );
      const sharedFields = parsed._shared || [];
      const nonSharedFields = Object.keys(selectors).filter(f => !sharedFields.includes(f));

      // Step 1: Slim the DOM and collect matching elements in order
      const elements = [];
      function collectMatching(node) {
        if (node.nodeType === 1) { // Element node
          for (const [field, selector] of Object.entries(selectors)) {
            if (!node.parentNode) continue;
            if (node.parentNode.querySelectorAll(selector).some(m => m == node)) {
              elements.push({ field, node });
              break;
            }
          }
          node.childNodes.forEach(collectMatching);
        }
      }
      collectMatching(root);

      // Step 2: Group and unroll in one pass
      const result = [];
      let currentObject = {};
      let sharedContext = {};
      let prevField = null;

      for (const { field, node } of elements) {
        const value = field == 'url' ? node.getAttribute('href') : node.textContent.trim();

        // Handle shared fields (e.g., generation as a header)
        if (sharedFields.includes(field)) {
          sharedContext[field] = value;
          prevField = null;
          prevValue = [];
          continue; // Don’t start a new object yet
        }

        // Check if this field starts a new object
        if (nonSharedFields.includes(field) && field in currentObject && prevField != field) {
          result.push({ ...sharedContext, ...currentObject });
          currentObject = {};
        }

        // Add value to current object
        if (field in currentObject) {
          if (!Array.isArray(currentObject[field])) {
            currentObject[field] = [currentObject[field]];
          }
          currentObject[field].push(value);
        } else {
          currentObject[field] = value;
        }
        prevField = field;
      }

      // Add last object if incomplete but has data
      if (Object.keys(currentObject).length > 0) {
        result.push({ ...sharedContext, ...currentObject });
      }

      return result;
    }

    const res = extractFields(root, parsed);
    console.log(res);
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
