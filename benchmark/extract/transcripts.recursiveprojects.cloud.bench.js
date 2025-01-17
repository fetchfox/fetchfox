import { fox } from "../../src/index.js";
import { itRunMatrix, runMatrix } from "../lib/index.js";
import { standardMatrix } from "../lib/matrix.js";
import { checkExcludeUrls } from "../lib/checks.js";
import { storeScores } from "../lib/store.js";

describe("extract from transcripts.recursiveprojects.cloud", async function () {
  const matrix = standardMatrix({});

  const expected = [
    {
      timestamp: "21:02:39",
      content:
        "Check the rear locket. There. Copy. Are we in forward brake balance? Yes, we do.",
    },
    {
      timestamp: "21:03:02",
      content:
        "Good warm-up on the brakes and everything will be fine. Bottas on a push lap, 12 seconds behind.",
    },
    {
      timestamp: "21:03:30",
      content: "And the wind is similar to our preflight.",
    },
    {
      timestamp: "21:04:50",
      content:
        "And no pressure from behind. Four tenths quicker than Charles. B1.",
    },
    {
      timestamp: "21:04:58",
      content: "Careful, double cool and a pass through.",
    },
    {
      timestamp: "21:05:08",
      content:
        "Yeah, we're in two-brake shape. Citroën just took us to the safe, yeah.",
    },
    {
      timestamp: "21:05:21",
      content:
        "It's now good from our side. We'll just stay out lap for brakes. Now it's all fine.",
    },
    {
      timestamp: "21:05:30",
      content:
        "Piastri on a push lap, six seconds. Piastri six on a time lap, five angry R behind him.",
    },
    {
      timestamp: "21:05:41",
      content: "Piastri full.",
    },
    {
      timestamp: "21:05:46",
      content: "Piastri free.",
    },
  ];

  const wf = await fox
    .init(
      "https://ffcloud.s3.amazonaws.com/fetchfox-docs/jbwswaczy5/https-transcripts-recursiveprojects-cloud-archive-18396-207381.html",
    )
    .extract({
      timestamp: "What is the timestamp of the message?",
      content: "What is the content of the message?",
    })
    .limit(10)
    .plan();

  return itRunMatrix(
    it,
    "extract transcript of Carlos Sainz",
    wf.dump(),
    matrix,
    [
      (items) => {
        const score = [0, 0];

        for (let i = 0; i < expected.length; i++) {
          score[1]++;
          if (i >= items.length) continue;
          const e = expected[i];
          const item = items[i];
          if ((item.timestamp || "").indexOf(e.timestamp) == -1) continue;
          if ((item.content || "").trim() != e.content.trim()) continue;
          score[0]++;
        }

        return score;
      },
    ],
    { shouldSave: true },
  );
});
