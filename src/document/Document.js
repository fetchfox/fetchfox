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

    const prompt = `Given some HTML, give me the CSS selector to select all the elements related to what the user is scraping.

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

    const slim = await this.slimmed(Object.values(parsed));
    console.log('slim', slim);

    function structureData(slim, parsed) {
      const root = slim;

      function matchesSelector(node, selector) {
        if (!node.parentNode) {
          // Never matches top-level node
          return false;
        }
        const container = node.parentNode.clone();
        for (const childNode of container.childNodes) {
          container.removeChild(childNode);
        }
        container.appendChild(node);

        return container.querySelector(selector) == node;
      }

      // Extract selectors and shared fields from template
      const selectors = Object.fromEntries(
        Object.entries(parsed).filter(([key]) => key != '_shared')
          .map(([key, desc]) => [key, desc])
      );
      const sharedFields = parsed._shared || [];
      const nonSharedFields = Object.keys(selectors).filter(f => !sharedFields.includes(f));

      // Collect and process elements
      const elements = [];
      function collectElements(node, selectors) {
        if (node?.nodeType != 1) return; // Skip non-element nodes

        let matchedField = null;
        for (const [field, selector] of Object.entries(selectors)) {
          if (matchesSelector(node, selector)) {
            matchedField = field;
            break;
          }
        }

        if (matchedField) {
          // Check if this node encapsulates other fields
          const childMatches = new Set();
          node.querySelectorAll('*').forEach(child => {
            for (const [f, s] of Object.entries(selectors)) {
              if (matchesSelector(child, s)) childMatches.add(f);
            }
          });

          if (childMatches.size > 0 && !sharedFields.includes(matchedField)) {
            // Encapsulated object (e.g., .infocard)
            const obj = processEncapsulated(node, selectors, sharedFields);
            elements.push({ field: matchedField, value: obj, isEncapsulated: true });
          } else {
            // Leaf node (e.g., .name, h2)
            const value = matchedField == 'url' ? node.getAttribute('href') : node.textContent.trim();
            elements.push({ field: matchedField, value, isEncapsulated: false });
          }
        } else {
          // Recurse into children
          node.childNodes.forEach(child => collectElements(child, selectors));
        }
      }

      // Process an encapsulated node recursively
      function processEncapsulated(node, selectors, sharedFields) {
        const obj = {};
        for (const [field, selector] of Object.entries(selectors)) {
          if (sharedFields.includes(field)) continue; // Skip shared fields here
          const matches = node.querySelectorAll(selector);
          console.log('selector', selector, matches);
          if (!matches) {
            console.log('node', node);
          }
          if (matches.length > 0) {
            const values = Array.from(matches).map(m =>
              field == 'url' ? m.getAttribute('href') : m.textContent.trim()
            );
            obj[field] = values.length > 1 ? values : values[0];
          }
        }
        return obj;
      }

      console.log('parsed', parsed);
      console.log('selectors', selectors);
      // Collect all elements in document order
      collectElements(root, selectors);
      console.log('elements', elements);

      // Group and unroll sequentially
      const result = [];
      let currentObject = {};
      let sharedContext = {};

      for (const { field, value, isEncapsulated } of elements) {
        if (isEncapsulated) {
          // Add encapsulated object(s) with shared context
          const objects = Array.isArray(value) ? value : [value];
          result.push(...objects.map(obj => ({ ...sharedContext, ...obj })));
          currentObject = {}; // Reset after encapsulated block
          continue;
        }

        // Handle shared fields
        if (sharedFields.includes(field)) {
          if (Object.keys(currentObject).length > 0) {
            result.push({ ...sharedContext, ...currentObject });
            currentObject = {};
          }
          sharedContext[field] = value;
          continue;
        }

        // Check if this field starts a new object
        if (nonSharedFields.includes(field) && field in currentObject) {
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
      }

      // Add final object if present
      if (Object.keys(currentObject).length > 0) {
        result.push({ ...sharedContext, ...currentObject });
      }

      return result;
    }

    const structured = structureData(slim, parsed);

    console.log("structured", JSON.stringify(structured));
    return structured;
  }

  async slimmed(selectors) {
    function matchesSelector(node, selector) {
      if (!node.parentNode) {
        // Never matches top-level node
        return false;
      }
      const container = node.parentNode.clone();
      for (const childNode of container.childNodes) {
        container.removeChild(childNode);
      }
      container.appendChild(node);

      return container.querySelector(selector) == node;
    }

    function filterNode(node, selectors) {

      let isMatch = selectors.some(
        selector => matchesSelector(node, selector)
      );

      // Create a shallow clone of the current node.
      let newNode = node.clone();
      newNode.childNodes = []; // Remove children to create a shallow copy

      // Recursively process each child.
      let hasMatchingChild = false;
      for (const child of node.childNodes) {
        // Process element nodes (for node-html-parser, check for tagName).
        if (child.tagName) {
          const filteredChild = filterNode(child, selectors);
          if (filteredChild) {
            newNode.appendChild(filteredChild);
            hasMatchingChild = true;
          }
        } else if (child.nodeType == 3) {  // For text nodes
          // Optionally include text nodes if the current node is a match.
          if (isMatch || hasMatchingChild) {
            newNode.appendChild(child.clone());
          }
        }
      }

      // Return the new node only if the current node or any of its descendants match.
      return isMatch || hasMatchingChild ? newNode : null;
    }

    // Assuming that `this.html` is an HTMLElement instance from node-html-parser.
    const root = parse(this.html)
    return filterNode(root, selectors);
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
