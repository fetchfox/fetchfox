import { fox, S3KV } from '../../src/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkIncreasingSize } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';

describe('action enforcetac.com', async function() {
  const matrix = standardMatrix();

  const prefixes = [
    'benchkv/fixed/',
    // `benchkv/random-${srid()}/`,
  ];

  for (const prefix of prefixes) {
    const wf = await fox
      .init('https://www.enforcetac.com/de-de/aussteller-produkte/aussteller-finden')
      .action({
        commands: [
          'click Allow all services to accept cookies',
          'paginate by scrolling to the bottom of the page 5 times',
        ]
      })
      .plan();

    await itRunMatrix(
      it,
      'action enforcetac.com',
      wf.dump(),
      matrix,
      [
        (items) => checkIncreasingSize(items, 5),
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
