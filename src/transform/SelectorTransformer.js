import pretty from 'pretty';
import AsyncLock from 'async-lock';
import { shortObjHash, clip } from '../util.js';
import { transform } from './transform.js';
import { BaseTransformer } from './BaseTransformer.js';
import { DropTransformer } from './DropTransformer.js';
import { TagsTransformer } from './TagsTransformer.js';
import * as prompts from './prompts.js';
import { parse } from 'node-html-parser';

let lockers = 0;
const lock = new AsyncLock();

export const SelectorTransformer = class extends BaseTransformer {
  constructor(template, options) {
    super(options);
    this.template = template;

    this.retries = 5; // max number of tries for missing selectors
  }

  key(url) {
    const u = new URL(url);
    const format = u.origin + u.pathname.replace(/[^/]+/g, '*');
    const hash = shortObjHash({ template: this.template });
    return `select-transform-${format}-${hash}`;
  }

  async get(html, url) {
    const key = this.key(url);

    return new Promise((ok) => {
      lockers++
      this.logger.debug(`${this} Wait for lock on ${key} (count=${lockers})`);
      lock.acquire(key, async (done) => {
        try {
          const saved = await this.kv.get(key);

          if (saved) {
            this.logger.debug(`${this} Found saved selectors from ${key}`);

            const selectors = saved.selectors;
            const missing = Object.keys(selectors)
              .filter(key => !selectors[key]);

            console.log('missing', missing, this.retries);

            if (missing.length && this.retries > 0) {
              this.retries--;

              this.logger.debug(`${this} Missing these selectors: ${JSON.stringify(missing)}`);
              const missingTemplate = {};
              for (const key of missing) {
                missingTemplate[key] = this.template[key];
              }

              const r = await this._learn(html, missingTemplate);

              console.log('retry gave', r);

              for (const key of missing) {
                if (r.selectors[key]) {
                  selectors[key] = r.selectors[key];
                }
              }

              await this.kv.set(key, { selectors });
            }

            ok({ selectors });
            return;
          }

          const r = await this._learn(html, this.template);
          const selectors = r?.selectors;

          // throw 'STOP 555';

          await this.kv.set(key, { selectors });
          ok({ selectors });

        } finally {
          lockers--;
          this.logger.debug(`${this} Release lock on ${key} (count=${lockers})`);
          done();
        }
      });
    });
  }

  async _transform(html, url) {

    const { selectors } = await this.get(html, url);

    this.logger.info(`${this} Got selectors: ${JSON.stringify(selectors)}`);

    console.log('selectors', selectors);

    if (!selectors) {
      this.logger.debug(`${this} Couldn't find any selectors`);
      return;
    }

    const root = parse(html);
    const keep = {};

    for (const key of Object.keys(selectors)) {
      const selector = selectors[key];
      if (!selector) continue;
      console.log('sel', key, selector);
      for (const el of root.querySelectorAll(selector)) {
        const hash = shortObjHash({ h: el.outerHTML });
        keep[hash] = key;
      }
    }

    // console.log('keep', keep);
    // throw 'KEEP';

    const prune = (node) => {
      const hash = shortObjHash({ h: node.outerHTML });
      if (keep[hash]) {
        console.log('keep[hash]', keep[hash]);
        node.setAttribute('data-field', keep[hash]);
        return node.outerHTML;
      }

      const childHtmls = [];
      for (const child of (node?.childNodes || [])) {
        const html = prune(child);
        if (html) {
          childHtmls.push(html);
        }
      }

      if (!childHtmls.length) {
        return null;
      } if (childHtmls.length == 1) {
        return childHtmls[0];
      } else {
        return `<div>` + childHtmls.join('\n') + '</div>';
      }
    }

    const out = prune(root);

    console.log('out', pretty(out, { ocd: true }));
    // throw 'STOP111';

    this.logger.debug(`${this} Seletors reduced HTML to: ${clip(out, 250)}`);

    return { html: out, selectors }
  }

  async _learn(html, template) {
    const out = await transform(
      html,
      [
        new TagsTransformer(),
        new DropTransformer(),
      ]);
    html = out.html;

    const context = {
      html: pretty(html, { ocd: true }),
      template: JSON.stringify(template, null, 2),
    };
    const { prompt }  = await prompts.selectors.renderCapped(
      context, 'html', this.ai.advanced);

    const answer = await this.ai.advanced.ask(prompt, { format: 'json' });

    console.log('ANSWER:', answer.partial);

    const selectors = { ...answer.partial };
    delete selectors._reasoning;

    return { selectors };
  }
}
