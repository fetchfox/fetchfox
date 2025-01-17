import { fox } from "../../src/index.js";
import { itRunMatrix, runMatrix } from "../lib/index.js";
import { standardMatrix } from "../lib/matrix.js";
import { checkExcludeUrls } from "../lib/checks.js";
import { storeScores } from "../lib/store.js";

describe("emails", async function () {
  const matrix = standardMatrix({
    prompt: ["find email address", "find email address, deobfuscate if needed"],
    url: [
      "https://opcam.ua.edu/contact.html",
      "https://www.radioalabama.net/contact",
      "https://www.redstate-strategies.com/contact",
      "https://aha-creative.com/contact-aha/",
    ],
  });

  const wf = await fox.init("{{url}}").extract({ email: "{{prompt}}" }).plan();

  return itRunMatrix(
    it,
    "find emails",
    wf.dump(),
    matrix,
    [
      (items) => {
        const score = [0, 0];
        for (const item of items) {
          score[1]++;
          if (!item.email) continue;
          if (item.email.indexOf("@") == -1) continue;
          score[0]++;
        }
        return score;
      },
    ],
    { shouldSave: true },
  );
});
