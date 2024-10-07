import {
  Crawler,
  DiskCache,
  Fetcher,
  Workflow,
  Planner,

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

  it('should plan a workflow', async () => {
    const cache = new DiskCache('/tmp/ft_workflow_test_7', { ttls: 10 * 24 * 3600 });
    // const cache = null;
    const ai = getAI('openai:gpt-4o-mini', { cache });
    const planner = new Planner({ ai, cache, limit: 2 });

    const steps = await planner.plan([
      'https://news.ycombinator.com/news',
      'find links to comments',
      'find links to user profiles',
      'get basic data',
      'export to hn.jsonl',
    ]);

    const flow = new Workflow(steps);
    const stream = flow.stream();
    for await (const { cursor, delta, index } of stream) {
      console.log(`Step ${index} delta: ${delta}`);
    }
  });

  it('should plan a workflow in single prompt', async () => {
    const cache = new DiskCache('/tmp/ft_workflow_test_7', { ttls: 10 * 24 * 3600 });
    // const cache = null;
    const ai = getAI('openai:gpt-4o-mini', { cache });
    const planner = new Planner({ ai, cache, limit: 10 });

    const steps = await planner.planCombined(`https://old.reddit.com/r/nfl/: find links to comment pages, find username of top commenter, export to reddit.jsonl`);

    const flow = new Workflow(steps);
    const stream = flow.stream();
    for await (const { cursor, delta, index } of stream) {
      console.log(`Step ${index} delta: ${delta}`);
    }
  });
});
