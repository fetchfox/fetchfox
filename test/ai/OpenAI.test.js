import assert from 'assert';
import process from 'node:process';
import { logger } from '../../src/log/logger.js';
import { getAI } from '../../src/index.js';
import { testCache, setTestTimeout } from '../lib/util.js';

describe('OpenAI', function() {

  setTestTimeout(this);

  before(() => {
    logger.testMode();
  });

  it('should run query @run @slow', async () => {
    const ai = getAI('openai:gpt-4o-mini');
    const answer = await ai.ask('return the word test five times', { format: 'text' });
    assert.ok(answer.partial.includes('test'));
  });

  it('should use api key @fast', async () => {
    const ai = getAI('openai:gpt-4o-mini', { apiKey: 'invalid', maxRetries: 0 });
    let err;
    try {
      await ai.ask('return the word test five times', { format: 'text' });
    } catch (e) {
      err = e;
    }
    assert.ok(!!err);
  });

  it('should run query (cached) @fast', async () => {
    const cache = testCache();
    const ai = getAI('openai:gpt-4o-mini', { cache });
    const answer = await ai.ask('return the word test five times', { format: 'text' });
    assert.ok(answer.partial.includes('test'));
  });

  it('should abort @fast', async () => {
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

  it('should support advanced @fast', async () => {
    const cache = testCache();

    const advanced = getAI('openai:gpt-4o', { cache });
    const ai = getAI('google:gemini-1.5-flash', { advanced, cache });

    const answerBasic = await ai.ask('what AI model are you?');
    const answerAdvanced = await ai.advanced.ask('what AI model are you?');

    assert.ok(answerBasic.partial.toLowerCase().includes('google'));
    assert.ok(!answerBasic.partial.toLowerCase().includes('openai'));
    assert.ok(answerAdvanced.partial.toLowerCase().includes('openai'));
    assert.ok(!answerAdvanced.partial.toLowerCase().includes('google'));
  });

  it('should support fall back if no advanced @fast', async () => {
    const cache = testCache();

    const ai = getAI('google:gemini-1.5-flash', { cache });

    const answerBasic = await ai.ask('what AI model are you?');
    const answerAdvanced = await ai.advanced.ask('what AI model are you?');

    assert.ok(answerBasic.partial.toLowerCase().includes('google'));
    assert.ok(!answerBasic.partial.toLowerCase().includes('openai'));
    assert.ok(answerAdvanced.partial.toLowerCase().includes('google'));
    assert.ok(!answerAdvanced.partial.toLowerCase().includes('openai'));
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
