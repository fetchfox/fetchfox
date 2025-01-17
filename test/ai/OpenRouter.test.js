import assert from 'assert';
import { getAI } from '../../src/index.js';
import { testCache } from '../lib/util.js';

describe('OpenRouter', function () {
  it('should use gpt-4o-mini with default base URL @run @slow', async () => {
    const cases = [
      'openrouter:openai/gpt-4o-mini',
      'openrouter:openai/gpt-4o',
      'openrouter:sao10k/l3.3-euryale-70b',
      'openrouter:eva-unit-01/eva-llama-3.33-70b',
    ];

    for (const id of cases) {
      const ai = getAI(id);
      const answer = await ai.ask('return the word test 20 times', { format: 'text' });
      assert.ok(answer.partial.includes('test'));
    }
  });

  it('should use gpt-4o-mini with default base URL (cached) @run @fast', async () => {
    const cases = [
      'openrouter:openai/gpt-4o-mini',
      'openrouter:openai/gpt-4o',
      'openrouter:sao10k/l3.3-euryale-70b',
      'openrouter:eva-unit-01/eva-llama-3.33-70b',
    ];

    for (const id of cases) {
      const cache = testCache();
      const ai = getAI(id, { cache });
      const answer = await ai.ask('return the word test 20 times', { format: 'text' });
      assert.ok(answer.partial.includes('test'));
    }
  });

  it('should use api key @run @fast', async () => {
    const ai = getAI('openrouter:openai/gpt-4o-mini', { apiKey: 'invalid', maxRetries: 0 });
    let err;
    try {
      await ai.ask('return the word test five times', { format: 'text' });
    } catch (e) {
      err = e;
    }
    assert.ok(!!err);
  });
});
