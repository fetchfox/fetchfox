import { fox, S3KV } from '../../src/index.js';
import { srid } from '../../src/util.js';
import { Item } from '../../src/item/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkItemsAI } from '../lib/checks.js';

describe('extract sketchfab.com', async function() {
  const matrix = standardMatrix();

  const expected = [];

  const prefixes = [
    // 'benchkv/fixed/',
    `benchkv/random-${srid()}/`,
  ];

  for (const prefix of prefixes) {
    const wf = await fox
      .init([
        // 'https://ffcloud.s3.us-west-2.amazonaws.com/fetchfox-docs/p1trkjb20j/https-sketchfab-com-3d-models-statuette-of-a-griffin-with-an-arimasp-a9f4a4a2bcfa4168a4a2255ede5b2f96',

        'https://sketchfab.com/3d-models/statuette-of-a-griffin-with-an-arimasp-a9f4a4a2bcfa4168a4a2255ede5b2f96',
        // 'https://sketchfab.com/3d-models/gilded-shortsword-032199081b53436ca389492f97943228'
      ])
      .extract({
        questions: {
          title: 'What is the item name?',
          price: 'What is the item Price',
        },
        mode: 'single',
        view: 'html',
      })
      .plan();

    itRunMatrix(
      it,
      `extract sketchfab.com`,
      wf.dump(),
      matrix,
      [
        (items) => {
          for (const i of items) {
            console.log(new Item(i).publicOnly());
          }
          return [0, 1];
          // return checkItemsAI(items, expected, questions);
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
