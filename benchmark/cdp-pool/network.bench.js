import fetch from 'node-fetch';
import { fox } from '../../src/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkItemsExact, checkItemsAI } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';

const limit = 5;

describe('network bench (pokemon)', function () {
  const matrix = standardMatrix();
  const jobId = 'ukchh85q9c';

  itRunMatrix(
    it,
    `network bench (pokemon)`,
    jobId,
    matrix,
    [
      async (items) => {
        console.log(items);
        const resp = await fetch(`https://fetchfox.ai/api/v2/jobs/${jobId}`);
        const data = await resp.json();
        const expected = (data.results.items || []).slice(0, limit);
        return checkItemsAI(items, expected);
      },
    ],
    { shouldSave: true, limit }
  );
});

describe('network bench (gardening)', function () {
  const matrix = standardMatrix();
  const jobId = 'uhi52qfxns';

  itRunMatrix(
    it,
    `network bench (gardening)`,
    jobId,
    matrix,
    [
      async (items) => {
        console.log(items);
        const resp = await fetch(`https://fetchfox.ai/api/v2/jobs/${jobId}`);
        const data = await resp.json();
        const expected = (data.results.items || []).slice(0, limit);
        return checkItemsAI(items, expected);
      },
    ],
    { shouldSave: true, limit }
  );
});

describe('network bench (cafe_menu)', function () {
  const matrix = standardMatrix();
  const jobId = 'oedrwllyub';

  itRunMatrix(
    it,
    `network bench (cafe_menu)`,
    jobId,
    matrix,
    [
      async (items) => {
        console.log(items);
        const resp = await fetch(`https://fetchfox.ai/api/v2/jobs/${jobId}`);
        const data = await resp.json();
        const expected = (data.results.items || []).slice(0, limit);
        return checkItemsAI(items, expected);
      },
    ],
    { shouldSave: true, limit }
  );
});

describe('network bench (cafe_menu2)', function () {
  const matrix = standardMatrix();
  const jobId = 'ojv553a91e';

  itRunMatrix(
    it,
    `network bench (cafe_menu2)`,
    jobId,
    matrix,
    [
      async (items) => {
        console.log(items);
        const resp = await fetch(`https://fetchfox.ai/api/v2/jobs/${jobId}`);
        const data = await resp.json();
        const expected = (data.results.items || []).slice(0, limit);
        return checkItemsAI(items, expected);
      },
    ],
    { shouldSave: true, limit }
  );
});

describe('network bench (cme_providers)', function () {
  const matrix = standardMatrix();
  const jobId = 's3dlpovpru';

  itRunMatrix(
    it,
    `network bench (cme_providers)`,
    jobId,
    matrix,
    [
      async (items) => {
        console.log(items);
        const resp = await fetch(`https://fetchfox.ai/api/v2/jobs/${jobId}`);
        const data = await resp.json();
        const expected = (data.results.items || []).slice(0, limit);
        return checkItemsAI(items, expected);
      },
    ],
    { shouldSave: true, limit }
  );
});

describe('network bench (reddit)', function () {
  const matrix = standardMatrix();
  const jobId = '1zaptil44c';

  itRunMatrix(
    it,
    `network bench (reddit)`,
    jobId,
    matrix,
    [
      async (items) => {
        console.log(items);
        const resp = await fetch(`https://fetchfox.ai/api/v2/jobs/${jobId}`);
        const data = await resp.json();
        const expected = (data.results.items || []).slice(0, limit);
        return checkItemsAI(items, expected);
      },
    ],
    { shouldSave: true, limit }
  );
});

describe('network bench (marketermilk)', function () {
  const matrix = standardMatrix();
  const jobId = 'co5wlslyk7';

  itRunMatrix(
    it,
    `network bench (marketermilk)`,
    jobId,
    matrix,
    [
      async (items) => {
        console.log(items);
        const resp = await fetch(`https://fetchfox.ai/api/v2/jobs/${jobId}`);
        const data = await resp.json();
        const expected = (data.results.items || []).slice(0, limit);
        return checkItemsAI(items, expected);
      },
    ],
    { shouldSave: true, limit }
  );
});

// describe('network bench', async () => {
//   const matrix = standardMatrix();
//   console.log(matrix[0]);
//   console.log(matrix[1]);

//   const expected = [];

//   const jobId = 'ukchh85q9c';
//   const limit = 5;

//   return itRunMatrix(
//     it,
//     `network bench pokemon`,
//     jobId,
//     matrix,
//     [
//       async (items) => {
//         console.log(items)
//         const resp = await fetch('https://fetchfox.ai/api/v2/jobs/' + jobId);
//         const data = await resp.json();
//         const expected = (data.results.items || []).slice(0, limit);
//         return checkItemsAI(items, expected);
//       },
//     ],
//     { shouldSave: true, limit });

// });


// describe('network bench multi', async () => {
//   const matrix = standardMatrix();
//   console.log(matrix[0]);
//   console.log(matrix[1]);

//   const cases = [
//     {
//       name: 'pokemon',
//       jobId: 'ukchh85q9c'
//     },
//     {
//       name: 'gardening',
//       jobId: 'uhi52qfxns'
//     },
//     {
//       name: 'cafe_menu',
//       jobId: 'oedrwllyub'
//     },
//     {
//       name: 'cafe_menu2',
//       jobId: 'ojv553a91e'
//     },
//     {
//       name: 'cme_providers',
//       jobId: 's3dlpovpru'
//     },
//     {
//       name: 'reddit',
//       jobId: '1zaptil44c'
//     },
//     {
//       name: 'marketermilk',
//       jobId: 'co5wlslyk7'
//     },
//   ]

//   const expected = [];

//   const limit = 5;

//   for (const {name, jobId} of cases) {
//     await itRunMatrix(
//     it,
//     `network bench (${name})`,
//     jobId,
//     matrix,
//     [
//       async (items) => {
//         console.log(items)
//         const resp = await fetch('https://fetchfox.ai/api/v2/jobs/' + jobId);
//         const data = await resp.json();
//         const expected = (data.results.items || []).slice(0, limit);
//         return checkItemsAI(items, expected);
//       },
//     ],
//     { shouldSave: true, limit });

//   }
// });