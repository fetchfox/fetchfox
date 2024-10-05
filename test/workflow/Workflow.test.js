import {
  Crawler,
  DiskCache,
  Fetcher,
  Workflow,

  getAI,
  getExtractor,
} from '../../src/index.js';

import {
  CrawlStep,
  ConstStep,
  FetchStep,
  ExtractStep,
} from '../../src/step/index.js';

describe('Workflow', function() {
  this.timeout(0);

  it('should run a workflow', async () => {
    const cache = new DiskCache('/tmp/ft_workflow_test_6', { ttls: 10 * 24 * 3600 });
    // const cache = null;

    const ai = getAI('openai:gpt-4o-mini', { cache });
    const crawler = new Crawler({ ai, cache });
    const fetcher = new Fetcher({ cache });
    const extractor = getExtractor('single-prompt', { ai, cache });

    const url = 'https://news.ycombinator.com/news';
    const query = 'Links to comment pages. The url MUST match this format: https://news.ycombinator.com/item?id=...';
    const questions = [
      'What is the title of the article?',
      'What is the URL of the article?',
      'Who submitted this article?',
      'How many points does the article have? Format: number',
      'How many comments does the article have? Format: number',
    ];

    const steps = [
      new ConstStep(url),
      new CrawlStep({ crawler, query }),
      new FetchStep({ fetcher }),
      new ExtractStep({ questions, extractor }),
    ];

    const flow = new Workflow(steps);

    // Run blocking
    // const { cursor } = await flow.run();
    // for (const item of cursor.head) {
    //   console.log('Cursor:', ''+item);
    // }

    // Run streaming
    const stream = flow.stream();
    for await (const { cursor, delta, index } of stream) {
      console.log(`Step ${index} delta: ${delta}`);
    }
  });
});
