// 
import { fox, DiskCache, DiskKV, S3KV } from '../../src/index.js';
import { srid } from '../../src/util.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkItemsAI, checkAtLeast } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';

describe('action portal.mara.gov.au', async function() {
  const matrix = standardMatrix();

  const prefixes = [
    // 'benchkv/fixed/',
    `benchkv/random-${srid()}/`,
  ];

  const limit = 50;

  for (const prefix of prefixes) {
    const wf = await fox
      .init('https://portal.mara.gov.au/search-the-register-of-migration-agents/')
      .action({
        commands: [
          `Type "a" into the field for "Agent's given name" and press enter.

Go through all the pages you see using the next page button which will have this HTML: <a href="#" data-page="2" role="button" data-toggle="tooltip" aria-label="Next page" title="" class="entity-pager-next-link" data-original-title="Next page">&gt;</a>.

Send the HTML for each page of results until there are no more pages.`
        ]
      })
      .extract({
        questions: {
          url: 'URL of the agent',
        },
        mode: 'multiple',
      })
      .limit(limit)
      .plan();

    await itRunMatrix(
      it,
      `action portal.mara.gov.au (prefix=${prefix})`,
      wf.dump(),
      matrix,
      [
        (items) => checkAtLeast(items, limit),
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
