import { fox, DiskCache, DiskKV, S3KV } from '../../src/index.js';
import { srid } from '../../src/util.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkItemsAI } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';

describe('action domain.com.au-agent-page', async function() {
  const matrix = standardMatrix();

  const cases = [
    {
      name: 'giovanni-spinella',
      url: 'https://www.domain.com.au/real-estate-agent/giovanni-spinella-1441300/',
      expected: [
        {
          name: 'Giovanni Spinella',
          phone: '0406 664 191',
        },
      ],
    },

    {
      name: 'jabyn-manning',
      url: 'https://www.domain.com.au/real-estate-agent/jabyn-manning-1884025/',
      expected: [
        {
          name: 'Jabyn Manning',
          phone: '0418 492 649',
        },
      ],
    },
  ];

  const prefixes = [
    // 'benchkv/fixed/',
    `benchkv/random-${srid()}/`,
  ];

  for (const prefix of prefixes) {
    for (const { name, url, expected } of cases) {
      const wf = await fox
        .init(url)
        .action({
          commands: [
            'Click the phone number button to reveal it'
          ]
        })
        .extract({
          questions: {
            name: 'Name of the agent',
            phone: 'Phone number of the agent',
          },
          mode: 'multiple',
        })
        .plan();

      await itRunMatrix(
        it,
        `action domain.com.au-agent-page (name=${name}, prefix=${prefix})`,
        wf.dump(),
        matrix,
        [
          (items) => {
            console.log(items);
            return checkItemsAI(items, expected, ['name', 'phone']);
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
  }
});
