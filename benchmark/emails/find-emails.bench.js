import { fox } from '../../src/index.js';
import { runMatrix, createMatrix } from '../lib/index.js';
import { checkExcludeUrls } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';


describe('emails', function() {
  this.timeout(3 * 60 * 1000); // 3 minutes

  it('should find emails on https://opcam.ua.edu/contact.html @bench', async () => {

    const wf = await fox
      .init('{{url}}')
      .extract({ email: '{{prompt}}' })
      .plan();

    const scores = await runMatrix(
      'find emails',
      wf.dump(),
      createMatrix({
        ai: [
          'openai:gpt-4o-mini',
          // 'openai:gpt-4o',
          // 'google:gemini-1.5-flash',
          // 'google:gemini-1.5-pro',
        ],
        fetcher: [
          // 'fetch',
          'playwright',
        ],
        prompt: [
          'find email address',
          // 'find email address, deobfuscate if needed',
        ],
        url: [
          'https://opcam.ua.edu/contact.html',
          'https://www.radioalabama.net/contact',
          'https://www.redstate-strategies.com/contact',
          'https://aha-creative.com/contact-aha/',
        ],
      }),
      [
        (items) => {
          const score = [0, 0];
          for (const item of items) {
            score[1]++;
            if (!item.email) continue;
            if (item.email.indexOf('@') == -1) continue;
            score[0]++;
          }
          return score;
        },
      ],
      { shouldSave: true });

    console.log(JSON.stringify(scores, null, 2));

    await storeScores(scores);

  });

});
