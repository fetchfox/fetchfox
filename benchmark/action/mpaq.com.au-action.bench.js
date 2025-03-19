import { fox, DiskCache, DiskKV, S3KV } from '../../src/index.js';
import { srid } from '../../src/util.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkItemsAI, checkAtLeast } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';

describe('action mpaq.com.au', async function() {
  const matrix = standardMatrix();

  const prefixes = [
    'benchkv/fixed/',
    // `benchkv/random-${srid()}/`,
  ];

  const limit = 50;

  for (const prefix of prefixes) {
    const wf = await fox
      .init('https://mpaq.com.au/find-a-plumber')
      .action({
        commands: [
          `Select each specialty, enter 4008 as the post code, select 30 kms, and click search.`
        ]
      })
      .extract({
        questions: {
          url: 'URL of the plumber',
        },
        mode: 'multiple',
      })
      .limit(limit)
      .plan();

    await itRunMatrix(
      it,
      `action mpaq.com.au (prefix=${prefix})`,
      wf.dump(),
      matrix,
      [
        (items) => {
          console.log('items', items);
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
