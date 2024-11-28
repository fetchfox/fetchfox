import { fox } from '../../src/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkExcludeUrls } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';

describe('crawl pokemondb', async function() {
  const matrix = standardMatrix({});

  const json = {
    "steps": [
      {
        "name": "const",
        "args": {
          "items": [
            {
              "url": "https://www.amazon.com/Skinnies-Instant-Lifts-Adhesive-Instantly/dp/B01BK2MXII"
            }
          ]
        }
      },
      {
        "name": "extract",
        "args": {
          "questions": {
            "review_text": "What is the text of the review?",
            "star_rating": "What is the star rating? Format: X/X",
            "review_date": "What is the date of the review?"
          }
        }
      }
    ],
    "options": {
      "limit": 50
    }
  };

  return itRunMatrix(
    it,
    'paginate amazon reviews',
    json,
    matrix,
    [
      (items) => {
        const score = [0, 0];

        console.log('got items', items);

        // const invalid = [
        //   'https://pokemondb.net/pokedex/national',
        //   'https://pokemondb.net/pokedex/all',
        // ];
        // for (const item of items) {
        //   score[1]++;
        //   if (!item.url) continue;
        //   if (invalid.includes(item.url)) continue;
        //   if (!item.url.match(/^https:\/\/pokemondb\.net\/pokedex\/[^/]+/)) continue;
        //   score[0]++;
        // }

        return score;
      },
    ],
    { shouldSave: true });
});
