import { fox, DiskCache, DiskKV, S3KV } from '../../src/index.js';
import { srid } from '../../src/util.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkItemsAI, checkAtLeast } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';

describe('action dmaar.com', async function() {
  const matrix = standardMatrix();

  const limit = 400

  const wf = await fox
    .init('https://www.dmaar.com/members/member-directory#membertype=REALTOR&page=1')
    .action({
      commands: [
        {
          prompt: 'Click \'Load More\' up to 300 times, or until you can\'t click it anymore. Send HTML after each click.',
          limit: '1'
        }
      ],
      limit: null
    })
    .extract({
      questions: {
        name: 'Agent name',
        company: 'Agent company',
        city: 'Agent city',
        member_id: 'Agent member ID from the \'View Member Info\' button HTML'
      },
      mode: 'multliple',
    })
    .limit(limit)
    .plan();

  itRunMatrix(
    it,
    `action dmaar.com`,
    wf.dump(),
    matrix,
    [
      (items) => {
        console.log('items', items.length);
      }
    ],
    {
      shouldSave: true,
      kv: new S3KV({
        bucket: 'ffcloud',
        prefix: 'benchkv/fixed/',
        // prefix: `benchkv/random-${srid()}/`,
        acl: 'public-read',
      }),
    });
});
