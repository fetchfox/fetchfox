import { fox } from '../../src/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkItemsAI } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';

describe('youtube.com comments', async function() {
  const matrix = standardMatrix();

  const cases = [
    {
      name: 'empty',
      url: 'https://ffcloud.s3.us-west-2.amazonaws.com/fetchfox-docs/qe034dvaex/https-www-youtube-com-watch-v-u6aEYuemt0M.html',
      expected: [],
    },
    {
      name: 'loaded',
      url: 'https://ffcloud.s3.us-west-2.amazonaws.com/fetchfox-docs/iqkc5lp2b0/https-www-youtube-com-watch-v-u6aEYuemt0M.html',
      expected: [
        {
          comment_text: 'Anybody just love the way Karpathy speaks? Makes me want to listen to him with intent',
          comment_author: '@rishabhpatra4950',
        },
        {
          comment_text: 'How did this went under my radar for 7+ years',
          comment_author: '@karanpatel1419',
        },
        {
          comment_text: 'I love listening to things I cannot understand',
          comment_author: '@grlldfsh123',
        },
        {
          comment_text: 'omg! He has done a great job in explaining this entirely new field of research in an hour!',
          comment_author: '@sanchitsinghiitg',
        },
        {
          comment_text: 'Hey Lex, canÂ´t thank you enough for splitting up the day-long streams! Much easier to consume -- as I wanted to download to enjoy it on mobile! I came across Andrej KarpathyÂ´s Deep Learning for Computer Vision yesterday. IÂ´ve been trying to really understand CNNs and the Deep Learning paradigms technically for some time now and sucked up everything I could since July. AndrejÂ´s lecture is the very best I found to get up to speed on most important details in the least possible time. Cheers G.',
          comment_author: '@gue2212',
        }
      ],
    },
  ];

  for (const { name, url, expected } of cases) {
    const wf = await fox
      .init(url)
      .extract({
        questions: {
          comment_text: 'What is the text of the comment? List them in order, starting with the first comment',
          comment_author: 'Who is the author of the comment?',
        },
        mode: 'multiple',
        view: 'html',
      })
      .limit(5)
      .plan();

    await itRunMatrix(
      it,
      `extract comments from a YouTube page (${name})`,
      wf.dump(),
      matrix,
      [
        (items) => checkItemsAI(items, expected, ['comment_text', 'comment_author']),
      ],
      { shouldSave: true });
  }
});
