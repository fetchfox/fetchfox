import { fox } from '../../src/index.js';
import { itRunMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkIncreasingSize } from '../lib/checks.js';

describe('pageAction https://ffcloud.s3.us-west-2.amazonaws.com/misc/homesmart-sample.html', async function() {
  const matrix = standardMatrix({
    fetcher: ['playwright'],
  });

  const wf = await fox
    .init('https://ffcloud.s3.us-west-2.amazonaws.com/misc/homesmart-sample.html')
    .action({ actions: ["Click on all the real estate agents."] })
    .limit(5)
    .plan();

  return itRunMatrix(
      it,
      'pageAction homesmart.com agents',
      wf.dump(),
      matrix,
      [
        checkIncreasingSize,
      ],
      { shouldSave: true }
    );
});