import assert from 'assert';
import process from 'node:process';
import { getAI } from '../../src/index.js';
import { testCache } from '../lib/util.js';

describe('OpenAI', function() {

  it('should run query @run @slow', async () => {
    const ai = getAI('openai:gpt-4o-mini');
    const answer = await ai.ask('return the word test five times', { format: 'text' });
    assert.ok(answer.partial.includes('test'));
  });

  it('should run query (cached) @run @fast', async () => {
    const cache = testCache();
    const ai = getAI('openai:gpt-4o-mini', { cache });
    const answer = await ai.ask('return the word test five times', { format: 'text' });
    assert.ok(answer.partial.includes('test'));
  });

  it('should abort @run', async () => {
    const controller = new AbortController();
    const signal = controller.signal;
    const ai = getAI('openai:gpt-4o-mini', { signal });

    setTimeout(() => controller.abort(), 10);
    const start = (new Date()).getTime();
    const answer = await ai.ask('return 20 random words', { format: 'text' });
    const took = (new Date()).getTime() - start;

    assert.ok(!answer.partial, 'no answer');
    assert.ok(took < 500, 'fast abort');
  });

  it('should receive base URL @run @slow', async () => {
    const controller = new AbortController();
    const signal = controller.signal;
    const ai = getAI(
      'openai:gpt-4o-mini',
      {
        baseURL: 'https://example.com',
        maxRetries: 0,
      });

    let error;
    try {
      const answer = await ai.ask('return 20 random words', { format: 'text' });
    } catch (e) {
      error = e;
    }

    // Expect an error from trying to use example.com as AI host
    assert.ok(!!error);
  });

});
