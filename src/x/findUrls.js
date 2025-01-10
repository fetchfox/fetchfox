import { getFetcher, getAI } from '../index.js';
import * as prompts from './prompts.js';

export const findUrls = async ({ url, ...rest }) => {
  const fetcher = rest?.fetcher || getFetcher();
  const ai = rest?.ai || getAI();

  console.log('find urls');

  const doc = await fetcher.first(url);
  console.log('doc: ' + doc);
  // const links = await doc.links();
  // console.log(doc.links);
  const urls = doc.links.map(it => it.url);
  const context = {
    urls: urls.join('\n'),
  };
  console.log('prompts.categorize', prompts.categorize);
  const { prompt } = await prompts.categorize.renderCapped(context, 'urls', ai);
  console.log('prompt', prompt);

  const stream = ai.stream(prompt, { format: 'jsonl' });
  for await (const partial of stream) {
    console.log('stream partial:', partial.delta);
  }

  // stages:
  // - rank
  // - categorize
  // - emit
}
