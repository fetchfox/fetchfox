import { fox } from '../../src/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkItemsExact } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';

describe('extract from cme providers', async function() {
  const matrix = standardMatrix({
  });

  const wf = await fox.load({"steps" :
    [
        {
            "name": "const",
            "args":
            {
                "items":
                [
                    {
                        "url": "https://accme.org/cme-provider-directory/"
                    }
                ],
                "maxPages": 1
            }
        },
        {
            "name": "crawl",
            "args":
            {
                "query": "Look for links to CME provider details pages. Ignore navigation links and advertisement links.",
                "maxPages": 3
            }
        },
        {
            "name": "extract",
            "args":
            {
                "questions":
                {
                    "provider_name": "What is the name of the provider, provider-title",
                    "address": "provider-detail-row \"Address\"",
                    "website": "What is the website of the provider? Format: full absolute URL",
                    "contact_name": "provider-detail-row \"Name of Contact\"",
                    "contact_phone": "provider-detail-row \"Phone Number\""
                },
                "single": false,
                "maxPages": "1000"
            }
        }
    ],
    "options": {"limit": 10}})


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
