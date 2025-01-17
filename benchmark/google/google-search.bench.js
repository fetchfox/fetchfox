import { fox } from "../../src/index.js";
import { itRunMatrix, runMatrix } from "../lib/index.js";
import { standardMatrix } from "../lib/matrix.js";
import { checkExcludeUrls } from "../lib/checks.js";
import { storeScores } from "../lib/store.js";

describe("google.com search", async function () {
  const matrix = standardMatrix({
    url: [
      "https://www.google.com/search?q=advertising+agencies+in+Alabama%2C+that+feature+political+advertising",
      "https://ffcloud.s3.amazonaws.com/fetchfox-docs/2yxgmko5yy/https-www-google-com-search-q-advertising-agencies-in-Alabama-2C-that-feature-political-advertising.html",
    ],
    prompt: [
      "Results",
      "Search result pages",
      "Search results pages url",
      "Urls of off-site search results, NOT on google.com",
    ],
  });

  {
    const json = {
      steps: [
        {
          name: "const",
          args: {
            items: [
              {
                url: "{{url}}",
              },
            ],
          },
        },
        {
          name: "extract",
          args: {
            questions: {
              url: "{{prompt}}",
            },
          },
        },
      ],
      options: {
        limit: 20,
      },
    };

    itRunMatrix(
      it,
      "exclude google.com from search results",
      json,
      matrix,
      [(items) => checkExcludeUrls(items, "google.com")],
      { shouldSave: true },
    );
  }

  {
    const json = {
      steps: [
        {
          name: "const",
          args: {
            items: [
              {
                url: "https://www.google.com/search?q=advertising+agencies+in+Alabama%2C+that+feature+political+advertising",
              },
            ],
          },
        },
        {
          name: "fetch",
          args: {
            urlFields: ["url"],
          },
        },
        {
          name: "crawl",
          args: {
            query: "find pagination links, eg. 1, 2, 3, 4...",
          },
        },
        {
          name: "extract",
          args: {
            questions: {
              url: "Search results pages url (Full absolute URL)",
            },
          },
        },
      ],
      options: {
        limit: 20,
      },
    };
    itRunMatrix(
      it,
      "exclude google.com with pagination",
      json,
      matrix,
      [(items) => checkExcludeUrls(items, "google.com")],
      { shouldSave: true },
    );
  }
});
