import { fox, DiskCache, DiskKV, S3KV } from '../../src/index.js';
import { srid } from '../../src/util.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkItemsAI } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';

describe('action deazy.com', async function() {
  const matrix = standardMatrix();

  const prefixes = [
    'benchkv/fixed/',
    `benchkv/random-${srid()}/`,
  ];

  const expected = [{
    cta_type: 'contact form',
    cta_is_contact_form: 'yes',
    cta_css_selector: '#book-a-call',
  }];

  for (const prefix of prefixes) {
    const wf = await fox
      .init('https://www.deazy.com/')
      .action({
        commands: ['click the main CTA button that is most likely to be for opening a contact form'],
      })
      .extract({
        questions: {
          'cta_type': 'What type of CTA is this?',
          'cta_is_contact_form': 'Does the CTA lead to a contact form? Answer "yes" or "no"',
          'cta_css_selector': 'What is a CSS selector that grabs the entire contact form HTML? Leave blank if CTA is not a contact form',
        },
        mode: 'single',
      })
      .plan();

    await itRunMatrix(
      it,
      `action deazy.com (prefix=${prefix})`,
      wf.dump(),
      matrix,
      [
        (items) => checkItemsAI(items, expected, ['cta_is_contact_form', 'cta_css_selector']),
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
