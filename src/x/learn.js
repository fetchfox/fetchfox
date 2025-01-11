import { getFetcher, getAI } from '../index.js';
import * as prompts from './prompts.js';

export const learn = async ({ url, prompt, ...rest }) => {
  const fetcher = rest?.fetcher || getFetcher();
  const ai = rest?.ai || getAI();

  const doc = await fetcher.first(url);
  console.log('doc: ' + doc);

  const urls = doc.links.map(it => it.url);
  const context = { urls: urls.join('\n') };
  const { prompt: catPrompt } = await prompts.categorize.renderCapped(context, 'urls', ai);

  // console.log('prompt', prompt);
  // const answer = await ai.ask(catPrompt, { format: 'jsonl' });
  // console.log('answer', answer.partial);

  const stream = ai.stream(catPrompt, { format: 'jsonl' });
  const promises = [];
  const seen = {};

  for await (const partial of stream) {
    const result = partial.delta;
    console.log('stream partial:', result);
    const { pattern } = result;

    if (seen[pattern]) {
      continue;
    }
    seen[pattern] = true;

    console.log('pattern', pattern);
    const regex = pattern.replace(/:[A-Za-z0-9-]+/g, '[^/]+');
    console.log(`${pattern} -> ${regex}`);
    const matches = urls.filter(url => (new RegExp(regex)).test(url));

    if (matches.length == 0) {
      continue;
    }
    const pageUrl = matches[0];

    if (seen[pageUrl]) {
      continue;
    }
    seen[pageUrl] = true;

    // console.log(matches);
    const category = {
      example: pageUrl,
      name: result.categoryName,
      pattern: result.pattern,
      regex: result.regex,
    };
    const promise = learnUrl({ url: pageUrl, ...rest })
      .then((items) => {
        return { items, category };
      });
    promises.push(promise);
  }

  const knowledge = {};
  const results = await Promise.all(promises);
  for (const result of results) {
    knowledge[result.category.pattern] = result;
  }
  return knowledge;
}

const learnUrl = async ({ url, prompt, ...rest }) => {
  const fetcher = rest?.fetcher || getFetcher();
  const ai = rest?.ai || getAI();

  console.log('get url: ' + url);
  const doc = await fetcher.first(url);
  console.log('learn url doc: ' + doc);
  const context = { url, prompt, html: doc.html };
  const { prompt: itemsPrompt } = await prompts.availableItems.renderCapped(context, 'html', ai);

  // console.log('prompt', prompt);

  const items = [];
  const stream = ai.stream(itemsPrompt, { format: 'jsonl' });
  for await (const partial of stream) {
    const result = partial.delta;
    console.log('got learn url result for', url);
    console.log('stream partial for url:', JSON.stringify(partial.delta, null, 2));
    items.push({
      item: result.item,
      schema: result.schema,
      // css: result.cssSelector,
      // xpath: result.xpathSelector,
    });
  }
  return items;
}
