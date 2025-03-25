import fetch from 'node-fetch';
import { fox } from '../../src/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkItemsExact, checkItemsAI } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';



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

// describe('extract ct.curaleaf.com', async function() {
//   const matrix = standardMatrix();

//   const cases = [
//     {
//       name: 'live',
//       url: 'https://www.equipnet.com/auctions/catalog/march-lab/1476/',
//       expected: [],
//     },
//     // {
//     //   name: 'saved',
//     //   url: 'https://ffcloud.s3.us-west-2.amazonaws.com/fetchfox-docs/93ue3wfv78/https-ct-curaleaf-com-shop-connecticut-curaleaf-ct-stamford-categories-flower.html',
//     //   expected,
//     // },
//   ];

//   const questions = {
//     auctionName: 'What the name of the auction',
//     location: 'What is the location',
//     category: 'what is the category',
//     url: 'what is the auction url',
//   }

//   for (const { name, url, expected } of cases) {
//     const wf = await fox
//       .init(url)
//       .extract({
//         questions,
//         mode: 'multiple',
//         view: 'html',
//       })
//       .limit(50)
//       .plan();

//     await itRunMatrix(
//       it,
//       `extract ct.curaleaf.com (${name})`,
//       wf.dump(),
//       matrix,
//       [
//         (items) => console.log(items),
//       ],
//       { shouldSave: true });
//   }
// });




describe('network bench multi', async () => {
  const matrix = standardMatrix();
  console.log(matrix[0]);
  console.log(matrix[1]);

  const cases = [
    {
      name: 'pokemon',
      jobId: 'ukchh85q9c'
    }

  ]

  const expected = [];

  const limit = 5;

  for (const {name, jobId} of cases) {
    await itRunMatrix(
    it,
    `network bench (${name})`,
    jobId,
    matrix,
    [
      async (items) => {
        console.log(items)
        const resp = await fetch('https://fetchfox.ai/api/v2/jobs/' + jobId);
        const data = await resp.json();
        const expected = (data.results.items || []).slice(0, limit);
        return checkItemsAI(items, expected);
      },
    ],
    { shouldSave: true, limit });

  }
});