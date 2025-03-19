import { fox, DiskCache, DiskKV, S3KV } from '../../src/index.js';
import { srid } from '../../src/util.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkItemsAI, checkAtLeast } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';

describe('action ct.curaleaf.com', async function() {
  const matrix = standardMatrix();

  const prefixes = [
    'benchkv/fixed/',
    // `benchkv/random-${srid()}/`,
  ];

  const limit = 100;

  for (const prefix of prefixes) {
    const wf = await fox
      .init('https://ct.curaleaf.com/shop/connecticut/curaleaf-ct-stamford/categories/flower')
      .extract({
        questions: {
          url: 'Product URL',
        },
        maxPages: 10,
        mode: 'multiple',
      })
      .limit(limit)
      .plan();

    await itRunMatrix(
      it,
      `action ct.curaleaf.com (prefix=${prefix})`,
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
