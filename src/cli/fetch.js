import { logger } from '../log/logger.js';
import { Fetcher } from '../../src/fetch/Fetcher.js';

export const fetch = async (url, { filename }) => {
  const ft = new Fetcher();
  const doc = await ft.fetch(url);
  if (filename) {
    await doc.save(filename);
    console.log(`Saved to ${filename}`);
  } else {
    console.log(doc.toString());
  }
}
