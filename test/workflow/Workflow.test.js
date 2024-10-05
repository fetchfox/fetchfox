import {
  Crawler,
  DiskCache,
  Fetcher,
  Workflow,

  getAI,
} from '../../src/index.js';

import {
  CrawlStep,
  ConstStep,
  FetchStep,
} from '../../src/step/index.js';

describe('Workflow', function() {
  this.timeout(0);

  it('should run a workflow', async () => {
    const cache = new DiskCache('/tmp/ft_workflow_test_5');
    // const cache = null;

    const ai = getAI('openai:gpt-4o-mini', { cache });
    const crawler = new Crawler({ ai, cache });
    const fetcher = new Fetcher({ cache });

    const steps = [
      new ConstStep({ items: [{ url: 'https://news.ycombinator.com/news' }]}),
      new CrawlStep({ crawler, query: 'Links to comment pages. The url MUST match this format: https://news.ycombinator.com/item?id=...' }),
      // new FetchStep({ fetcher }),
    ];

    const flow = new Workflow(steps);
    const cursor = await flow.run();

    for (const item of cursor.head) {
      console.log('Item:', item);
    }
  });
});
