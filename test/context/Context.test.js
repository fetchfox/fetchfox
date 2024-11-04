import assert from 'assert';
import os from 'os';
import { Context } from '../../src/context/Context.js';

describe('Context', function() {

  it('should update recursively @run', () => {
    const ctx = new Context({ publishAllSteps: true, limit: 5 });

    assert.equal(ctx.fetcher.constructor.name, 'Fetcher');
    assert.equal(ctx.crawler.fetcher.constructor.name, 'Fetcher');
    assert.equal(ctx.extractor.fetcher.constructor.name, 'Fetcher');

    ctx.update({ fetcher: 'playwright' });

    assert.equal(ctx.fetcher.constructor.name, 'PlaywrightFetcher');
    assert.equal(ctx.crawler.fetcher.constructor.name, 'PlaywrightFetcher');
    assert.equal(ctx.extractor.fetcher.constructor.name, 'PlaywrightFetcher');

    assert.equal(ctx.extractor.ai.constructor.name, 'OpenAI');

    ctx.update({ ai: 'groq' });

    assert.equal(ctx.extractor.ai.constructor.name, 'Groq');

    assert.equal(ctx.publishAllSteps, true);
    assert.equal(ctx.limit, 5);

    // TODO: re-enable these checks once context outputs the data
    // const dump = ctx.dump();
    // assert.equal(dump.publishAllSteps, true);
    // assert.equal(dump.limit, 5);
    // assert.equal(dump.ai, 'groq');
    // assert.equal(dump.fetcher, 'playwright');
  });

});
