import { fox } from '../../src/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix, newStandardMatrix } from '../lib/matrix.js';
import { checkExcludeUrls } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';
import { url } from 'inspector';

describe('crawl pokemondb', async function() {
  const matrix = newStandardMatrix({
    prompt: [
      'find pokemon',
      'find links to pokemon pages',
      'find links to pokemon pages. ONLY find pokemon CHARACTER pages, not general pages or navigation, etc.',
    ],
    exp: [
      {
        input_format: "page",
        output_format: "url",
      },
      {
        input_format: "links",
        output_format: "id",
      },
      {
        input_format: "links",
        output_format: "url",
      },
    ],
  });

  const wf = await fox
    .init('https://pokemondb.net/pokedex/national')
    .crawl({ query: '{{prompt}}' })
    .limit(20)
    .plan();

  return itRunMatrix(
    it,
    'crawl pokemon',
    wf.dump(),
    matrix,
    [
      (items) => {
        const score = [0, 0];
        const invalid = [
          'https://pokemondb.net/pokedex/national',
          'https://pokemondb.net/pokedex/all',
        ];

        for (const item of items) {
          score[1]++;
          const url = item.url || item._url;
          if (!url) continue;
          if (invalid.includes(url)) continue;
          if (!url.match(/^https:\/\/pokemondb\.net\/pokedex\/[^/]+/)) continue;
          score[0]++;
        }

        return score;
      },
    ],
    { shouldSave: true });
});
