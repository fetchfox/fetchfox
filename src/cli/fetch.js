import { Fetcher } from '../../src/fetch/Fetcher.js';
import { logger } from '../log/logger.js';

export const fetch = async (url, options) => {
  const ft = new Fetcher();
  const doc = await ft.fetch(url);
  if (options.save) {
    await doc.save(options.save);
    console.log(`Saved to ${options.save}`);
  } else {
    console.log(doc.toString());
  }
}
