import { logger } from '../log/logger.js';
import { getFetcher } from './util.js';

export const fetch = async (url, options) => {
  const ft = getFetcher(options.fetcher);
  const doc = await ft.fetch(url);
  const { filename } = options;
  if (filename) {
    await doc.save(filename);
    console.log(`Saved to ${filename}`);
  } else {
    console.log(doc.toString());
  }
}
