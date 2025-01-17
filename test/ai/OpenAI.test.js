import assert from 'assert';
import process from 'node:process';
import { getAI } from '../../src/index.js';

describe('OpenAI', function () {
  it('should abort @run', async () => {
    const controller = new AbortController();
    const signal = controller.signal;
    const ai = getAI('openai:gpt-4o-mini', { signal });

    setTimeout(() => controller.abort(), 10);
    const start = new Date().getTime();
    const answer = await ai.ask('return 20 random words', { format: 'text' });
    const took = new Date().getTime() - start;

    assert.ok(!answer.partial, 'no answer');
    assert.ok(took < 500, 'fast abort');
  });
});
