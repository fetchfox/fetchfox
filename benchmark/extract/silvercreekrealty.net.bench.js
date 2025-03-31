import { fox } from '../../src/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkItemsAI } from '../lib/checks.js';

describe('extract from https://silvercreekrealty.net/silvercreek-agent-directory', async function() {
  const matrix = standardMatrix({
  });

  const expected = [
    {
      name: 'Ebie Hepworth',
      email: 'hepworthrealestate@gmail.com',
      url: 'https://silvercreekrealty.net/profile/Ebie-Hepworth/'
    },
    {
      name: 'Eastin Johnson',
      email: 'eastin@nidaholiving.com',
      url: 'https://silvercreekrealty.net/profile/Eastin-Johnson/'
    },
    {
      name: 'Ed Schwehr',
      email: 'eschwehr.realestate@gmail.com',
      url: 'https://silvercreekrealty.net/profile/Ed-Schwehr/'
    },
    {
      name: 'Eduardo Rivas',
      email: 'rivasidahorealestate@gmail.com',
      url: 'https://silvercreekrealty.net/profile/Eduardo-Rivas/'
    },
    {
      name: 'Elaine Prokschl-Bailey',
      email: 'elaine@home4idaho.com',
      url: 'https://silvercreekrealty.net/profile/Elaine-Prokschl-Bailey/'
    },
    {
      name: 'Eli Dahlin',
      email: 'elias.dahlin11@gmail.com',
      url: 'https://silvercreekrealty.net/profile/Eli-Dahlin/'
    },

    {
      name: 'Elise Wishlow',
      email: 'elise@elisewishlowrealestate.com',
      url: 'https://silvercreekrealty.net/profile/Elise-Wishlow/'
    },
    {
      name: 'Elizabeth Bagley',
      email: 'ebagley814@gmail.com',
      url: 'https://silvercreekrealty.net/profile/Elizabeth-Bagley/'
    },
    {
      name: 'Elizabeth Braun',
      email: 'lizbraun33@gmail.com',
      url: 'https://silvercreekrealty.net/profile/Elizabeth-Braun/'
    },
    {
      name: 'Elizabeth Flores',
      email: 'Elizflores.idrealestate@gmail.com',
      url: 'https://silvercreekrealty.net/profile/Elizabeth-Flores/'
    }
  ];

  const cases = [
    {
      name: 'live',
      url: 'https://silvercreekrealty.net/silvercreek-agent-directory/?staff-az=E',
      expected,
    },
    {
      name: 'saved',
      url: 'https://ffcloud.s3.us-west-2.amazonaws.com/fetchfox-docs/ke9l83vymk/https-silvercreekrealty-net-silvercreek-agent-directory-staff-az-E.html',
      expected,
    },
  ];

  const questions = {
    name:	'What is the name of this agent?',
    email: 'What is the email address of this agent? Format: email@example.com',
    url: `What is the URL of this agent's profile? Format: full absolute URL`,
  }

  for (const { name, url, expected } of cases) {
    const wf = await fox
      .init(url)
      .crawl({
        query: 'Look for links to real estate agent profiles. Find specific individual real estate agents',
        limit: 10,
      })
      .extract({ questions })
      .limit(10)
      .plan();

    return itRunMatrix(
      it,
      `extract realtors from page E of Silver Creek Realty (${name})`,
      wf.dump(),
      matrix,
      [
        (items) => checkItemsAI(items, expected, questions),
      ],
      { shouldSave: true });
    }
});
