import { fox } from '../../src/index.js';
import { Item } from '../../src/item/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkItemsAI, checkAtLeast } from '../lib/checks.js';

describe('extract finefettle.com', async function() {
  const matrix = standardMatrix();

  const wf = await fox
    .init('https://www.finefettle.com/connecticut/stamford-dispensary/recreational/menu/flower')
    .extract({
      questions: {
        loaded: 'Is this page fully loaded? it is loaded if there are many products wiht prices visible. Answer "yes" or "no"',
        captcha: 'Is there a captcha or other scraper blocker on this page? "yes" or "no"',
      },
      mode: 'single',
      view: 'html',
    })
    .plan();

  await itRunMatrix(
    it,
    `fetch finefettle.com`,
    wf.dump(),
    matrix,
    [
      (items) => {
        console.log('items', items);
      },
    ],
    { shouldSave: true });
});
