import { fox } from '../../src/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkExcludeUrls } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';

describe('crawl pressebox.com', async function() {
  const matrix = standardMatrix({
    prompt: [
      'find press releases',
      'find links to press release pages',
      'find links to press release pages. ONLY find specific press releases pages, not general pages, job listing, etc.',
    ],
  });

  const wf = await fox
    .init('https://www.pressebox.com/')
    .crawl({ query: '{{prompt}}' })
    .limit(20)
    .plan();

  return itRunMatrix(
    it,
    'crawl pressebox.com',
    wf.dump(),
    matrix,
    [
      (items) => {
        const score = [0, 0];

        for (const item of items) {
          score[1]++;
          const url = item.url || item._url;
          if (!url) continue;
          if (!url.match(/^https:\/\/www\.pressebox\.com\/pressrelease\//)) continue;
          score[0]++;
        }

        return score;
      },
    ],
    { shouldSave: false });
});
