import { fox, DiskCache, DiskKV, S3KV } from '../../src/index.js';
import { srid } from '../../src/util.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkItemsAI, checkAtLeast } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';

describe('action onereal.com', async function() {
  const matrix = standardMatrix();

  const prefixes = [
    'benchkv/fixed/',
    // `benchkv/random-${srid()}/`,
  ];

  const limit = 50;

  for (const prefix of prefixes) {
    const wf = await fox
      .init('https://onereal.com/search-agent?search_by=LOCATION&state_code=US-FL')
      .action({
        commands: [
          `Click show more up to 2 times`
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
          agent_name: 'What is the name of the agent?   ',
          location: 'What is the location of the agent?',
          url: 'What is the link to the agent profile?',
          email_address: 'What is the email address of the agent?',
          phone_number: 'What is the phone number of the agent?',
        },
        mode: 'single',
      })
      .limit(limit)
      .plan();

    await itRunMatrix(
      it,
      `action onereal.com (prefix=${prefix})`,
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
