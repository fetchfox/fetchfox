import * as cheerio from 'cheerio';
import { fox, DiskCache, DiskKV, S3KV } from '../../src/index.js';
import { srid } from '../../src/util.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkAtLeast } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';

describe('workflow provokemedia.com', async function() {
  const matrix = standardMatrix();

  const prefixes = [
    'benchkv/fixed/',
    // `benchkv/random-${srid()}/`,
  ];

  for (const prefix of prefixes) {
    const limit = 50;

    const wf = await fox
      .init('https://www.provokemedia.com/agency-playbook/ExpertiesAreas/all/regions/north-america')
      .action({
        commands: [
          {
            prompt: 'Scroll down to the bottom of the page, wait 4 seconds. Repeat this 5 times. Only send HTML at the END of all the scrolls',
            limit: 1
          }
        ],
        limit: null
      })
      .extract({
        questions: {
          agency_name: 'What is the name of the agency? ',
          url: 'What is the URL of the agency? Format: Absolute URL',
          // url: 'What is the URL for more details? Format: Absolute URL',
        },
        mode: 'multiple',
        view: 'html',
        maxPages: 1,
        limit,
      })
      .extract({
        questions: {
          contact_info: 'What is the contact information?',
          services_offered: 'What services does the agency offer?',
          key_clients: 'Who are the key clients of the agency?',
          url: 'What is the URL of the agency page? Format: Absolute URL',
          email: 'What is the email address if available?',
          location: 'What is the location of the agency? Full address'
        },
        mode: 'single',
        view: 'html',
        maxPages: 1,
        limit,
      })
      .limit(limit)
      .plan();

    itRunMatrix(
      it,
      'workflow provokemedia.com',
      wf.dump(),
      matrix,
      [
        (items) => {
          console.log('items', items);
          console.log('items', items.length);
          return checkAtLeast(items.filter(it => Boolean(it.location)), limit);
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
