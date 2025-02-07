import { fox } from '../../src/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkExcludeUrls } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';

describe('crawl www2.evo.gg-videos', async function() {
  const matrix = standardMatrix({
    prompt: [
      'videos',
      'video pages',
    ],
  });

  const wf = await fox
    .init('https://www2.evo.gg/videos')
    .crawl({ query: '{{prompt}}' })
    .limit(40)
    .plan();

  return itRunMatrix(
    it,
    'crawl www2.evo.gg-videos',
    wf.dump(),
    matrix,
    [
      (items) => {
        const score = [0, 0];

        for (const item of items) {
          score[1]++;
          const url = item.url || item._url;
          if (!url) continue;
          if (!url.match(/^https:\/\/www2\.evo\.gg\/video\//)) continue;
          score[0]++;
        }

        return score;
      },
    ],
    { shouldSave: true });
});
