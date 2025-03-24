import { fox } from '../../src/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkItemsExact } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';
import fetch from 'node-fetch';


describe('extract from cme providers', async function() {
  const matrix = standardMatrix({
  });

  // in put will jobid from prod
  const jobId = 'ukchh85q9c';
  // array of these
  const resp = await fetch('https://fetchfox.ai/api/v2/jobs/'+jobId)
  const data = await resp.json()
  const workflow = data.workflow
  console.log(workflow)

  const results = data.results.items

  const wf = await fox.load(workflow).plan()
  console.log(wf.dump())

  return itRunMatrix(
    it,
    'sample job of cme providers',
    wf.dump(),
    matrix,
    [
      (items) => { console.log(JSON.stringify(items, null, 2)) },
    ],
    { shouldSave: true });
});
