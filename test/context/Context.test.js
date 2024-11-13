import assert from 'assert';
import os from 'os';
import { Context } from '../../src/context/Context.js';

describe('Context', function() {

  it('should update @run', () => {
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

    assert.equal(ctx.dump().publishAllSteps, true);
    assert.equal(ctx.dump().limit, 5);
    assert.equal(ctx.dump().ai, 'groq');
    assert.equal(ctx.dump().fetcher, 'playwright');

    ctx.update({ ai: 'openai:gtp-4o' });
    assert.equal(ctx.dump().ai, 'openai:gtp-4o');

    ctx.update({ ai: ['openai', { model: 'gpt-4o' }] });
    assert.equal(
      JSON.stringify(ctx.dump().ai),
      '["openai",{"model":"gpt-4o"}]');

    ctx.update({ fetcher: ['playwright', { cdp: 'ws://example.com/ws' }] });
    assert.equal(
      JSON.stringify(ctx.dump().ai),
      '["openai",{"model":"gpt-4o"}]');
    assert.equal(
      JSON.stringify(ctx.dump().fetcher),
      '["playwright",{"cdp":"ws://example.com/ws"}]');

  });

});
