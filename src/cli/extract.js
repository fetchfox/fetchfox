import Papa from 'papaparse';
import { logger } from '../log/logger.js';
import { Basic } from '../extract/Basic.js';
import { saveItems } from '../extract/save.js';
import { getAi, getFetcher } from './util.js';

export const extract = async (url, questions, options) => {
  const ai = getAi(options.ai, options.apiKey);
  const ft = getFetcher(options.fetcher);
  const ex = new Basic(ai);
  const doc = await ft.fetch(url);
  const result = Papa.parse(questions);
  if (result.error) {
    console.error(`Could not parse questions: ${result.error}`);
  }
  const description = options.item;
  const { limit } = options;
  const items = await ex.extract(
    doc,
    result.data[0],
    ({ delta, partial }) => {
      for (const item of delta) {
        console.log(item);
      }
    },
    { description, limit });

  if (options.save) {
    saveItems(options.save, items);
    console.log('Saved results to', options.save);
  }
}
