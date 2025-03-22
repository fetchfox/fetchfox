import { fox, DiskCache, DiskKV, S3KV } from '../../src/index.js';
import { srid } from '../../src/util.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkItemsAI } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';

describe('extract kw.com', async function() {
  const matrix = standardMatrix();

  const prefixes = [
    'benchkv/fixed/',
    `benchkv/random-${srid()}/`,
  ];

  for (const prefix of prefixes) {
    const wf = await fox
      .init('https://www.kw.com/agents?searchType=name&text=a&page=1')
      .action({
        commands: [
          `Go through all the pages by clicking next`
        ]
      })
      .extract({
        questions: {
          name: 'Name of the agent',
          phone: 'Phone number of the agent',
          email: 'Email address of the agent',
        },
        mode: 'multiple',
      })
      .limit(50)
      .plan();

    await itRunMatrix(
      it,
      `extract kw.com (prefix=${prefix})`,
      wf.dump(),
      matrix,
      [
        (items) => {
          console.log('items', items);
          // return checkItemsAI(items, expected, ['name', 'phone', 'email']);
          // TODO: check it, right now this is known to not work
          return [0, 1];
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
