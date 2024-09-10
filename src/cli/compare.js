import Papa from 'papaparse';
import { logger } from '../log/logger.js';
import { Basic } from '../extract/Basic.js';
import { saveItems } from '../extract/save.js';
import { getAi, getFetcher } from './util.js';

export const compare = async (url, questions, options) => {
  const { compare } = options;
  const ft = getFetcher(options.fetcher);

  questions = (Papa.parse(questions)).data[0];
  const description = options.item;
  const { limit } = options;
  const doc = await ft.fetch(url);

  const results = {};

  const questionsSet = new Set();
  for (const c of compare) {
    const ai = getAi(c);
    const ex = new Basic(ai);
    const { items } = await ex.extract(doc, questions, null, { limit: 1 });
    for (const q of Object.keys(items[0].data)) {
      questionsSet.add(q);
    }
    console.log(`Completed extraction with ${c}`);
    results[c] = { ai, items };
  }

  const inMajority = {};
  console.log('');
  for (const q of questionsSet) {
    const votes = {};
    for (const c of compare) {
      const item = results[c].items[0];
      const answer = item.data[q];
      votes[answer] ||= [];
      votes[answer].push(c);
    }

    console.log(`Field: ${q}`);
    let majorityAnswer;
    for (const answer of Object.keys(votes)) {
      const which = votes[answer];
      console.log(`- "${answer}" got ${which.length}: ${which.join(', ')}`);

      if (!majorityAnswer || which.length > votes[majorityAnswer].length) {
        majorityAnswer = answer;
      }
    }

    for (const c of compare) {
      if (results[c].items[0].data[q] == majorityAnswer) {
        inMajority[c] = (inMajority[c] || 0) + 1;
      }
    }

    console.log('');
  }

  console.log('Times each model agreed with the consensus:');
  console.log(inMajority);
}
