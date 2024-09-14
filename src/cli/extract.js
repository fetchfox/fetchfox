import fs from 'fs';

import Papa from 'papaparse';
import { logger } from '../log/logger.js';
import { BasicExtractor } from '../extract/BasicExtractor.js';
import { Document } from '../document/Document.js';
import { DiskCache } from '../cache/DiskCache.js';
import { saveItems } from '../extract/save.js';
import { getAi } from '../ai/index.js';
import { getFetcher } from '../fetch/index.js';

export const extract = async (url, questions, options) => {
  const cache = options.cache ? new DiskCache(options.cache) : null;
  const ai = getAi(options.ai, options.apiKey, { cache });
  const ex = new BasicExtractor(ai);

  let doc;
  const isFile = fs.existsSync(url);
  if (isFile) {
    doc = new Document();
    await doc.load(url);
  } else {
    doc = await getFetcher(options.fetcher, { cache }).fetch(url);
  }
  
  questions = (Papa.parse(questions)).data[0];
  const description = options.item;
  const { limit } = options;

  const answer = await ex.all(doc, questions);
  console.log(answer);

  // for await (const result of ex.stream()) {
  //   console.log(result);
  // }  
}
