import { fox, DiskCache, DiskKV, S3KV } from '../../src/index.js';
import { srid } from '../../src/util.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkItemsAI, checkAtLeast } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';

describe('extract bokadirekt.se', async function() {
  const matrix = standardMatrix();

  const prefixes = [
    'benchkv/fixed/',
    // `benchkv/random-${srid()}/`,
  ];

  const limit = 10;

  for (const prefix of prefixes) {
    const wf = await fox
      .init('https://www.bokadirekt.se/places/rehabkliniken-33257')
      .action({
        commands: [
          'Accept cookies if you need to. Then, click the button to show all reviews. It will say "Visa fler recensioner". If there is a button that says "Visa mer" click it to load even more reviews. Click "Visa mer" up to 10 times before sending all HTML. "Visa mer" must be in the .ReactModalPortal component',
        ]
      })
      .extract({
        questions: {
          url: 'URL of the agent profile',
        },
        mode: 'multiple',
      })
      .extract({
        questions: {
          author: 'Who is the author of this review?',
          review_date: 'What is the date of this review?',
          review_text: 'What is the text of the review?',
          review_score: 'What is the score given in the review?'
        },
        mode: 'auto',
        view: 'html',
        maxPages: 1
      })
      .limit(10)
      .plan();

    await itRunMatrix(
      it,
      `extract bokadirekt.se (prefix=${prefix})`,
      wf.dump(),
      matrix,
      [
        (items) => {
          // TODO: check it items via checkItemsAI
          // return checkItemsAI(items, expected, ['name', 'phone', 'email']);
          return checkAtLeast(items, limit)
        }
      ],
      {
        shouldSave: true,
        kv: new S3KV({
          bucket: 'ffcloud',
          prefix,
          acl: 'public-read',
        }),
      });
  }
});
