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
  questions = (Papa.parse(questions)).data[0];
  const description = options.item;
  const { limit } = options;
  const { items } = await ex.extract(
    doc,
    questions,
    ({ delta, partial }) => {
      for (const item of delta) {
        console.log(item.data);
        if (options.save) {
          item.save(
            options.save,
            {
              append: true,
              format: options.format,
              saveSource: options.saveSource,
            });
        }
      }
    },
    { description, limit });
}
