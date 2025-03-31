import { fox, DiskCache, DiskKV, S3KV } from '../../src/index.js';
import { srid } from '../../src/util.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkItemsAI } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';

describe('action infigo.net', async function() {
  const matrix = standardMatrix();

  const prefixes = [
    // 'benchkv/fixed/',
    `benchkv/random-${srid()}/`,
  ];

  const cases = [
    {
      name: 'deazy.com',
      url: 'https://www.deazy.com/',
      expected: [{
        cta_type: 'contact form',
        cta_is_contact_form: 'yes',
        cta_css_selector: '#book-a-call',
      }],
    },

    {
      name: 'infigo.net',
      url: 'https://www.infigo.net/',
      expected: [{
        cta_type: 'contact form',
        cta_is_contact_form: 'yes',
        cta_css_selector: '.hbspt-form',
      }],
    },

    {
      name: 'actable.ai',
      url: 'https://www.actable.ai/',
      expected: [{
        cta_type: 'calendly link',
        cta_is_contact_form: 'no',
        cta_css_selector: '',
      }],
    },

    {
      name: 'acto.com',
      url: 'https://acto.com/',
      expected: [{
        cta_type: 'contact form',
        cta_is_contact_form: 'yes',
        cta_css_selector: '.x-content iframe',
      }],
    },
  ]

  for (const { name, url, expected } of cases) {
    for (const prefix of prefixes) {
      const wf = await fox
        .init(url)
        .action({
          commands: ['click any cookie acceptance modals, etc. then click the main CTA button that is most likely to be for opening a contact form'],
        })
        .extract({
          questions: {
            cta_type: 'What type of CTA is this?',
            cta_url: 'What is the URL of the CTA page?',
            cta_is_contact_form: 'Does the CTA lead to a contact form? Answer "yes" or "no"',
            cta_css_selector: 'What is a CSS selector that grabs the entire contact form HTML? Leave blank if CTA is not a contact form',
          },
          mode: 'single',
        })
        .plan();

      await itRunMatrix(
        it,
        `action ${name} (prefix=${prefix})`,
        wf.dump(),
        matrix,
        [
          (items) => {
            console.log('ITEMS', items);
            return checkItemsAI(items, expected);
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
