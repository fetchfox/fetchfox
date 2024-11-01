import assert from 'assert';
import process from 'node:process';
import { getAI } from '../../src/index.js';

describe('AI', function() {
  this.timeout(10000);

  it('should default to OpenAI gpt-4o-mini @run', () => {
    const ai = getAI();
    assert.equal(ai.constructor.name, 'OpenAI');
    assert.equal(ai.model, 'gpt-4o-mini');
  });

  it('should fail without env variable @run', () => {
    const key = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;

    try {
      let err;
      try {
        const ai = getAI();
      } catch(e) {
        err = e;
      }
      assert.ok(('' + err).indexOf('missing API key for OpenAI') != -1, 'expect API key error');
    } finally {
      process.env.OPENAI_API_KEY = key;
    }
  });

  it('should work with ollama', async () => {
    const ollama = getAI('ollama:llama3.1:8b');
    const answer = await ollama.ask('Say exactly this word: "test"');
    assert.ok(answer.partial.toLowerCase().indexOf('test') != -1, 'ollama should say test');
  });

  it('should be concurrent', async () => {
    const ai = getAI();
    await Promise.all([
      new Promise(async (ok) => {
        const stream = ai.stream(
          'generate a 10 stanza haiku in JSONL format, where each line is like this: {"line":"..haiku line..."}',
          { format: 'jsonl' });

        for await (const r of stream) {
          console.log('r1->', r.delta.line);
        }
      }),
      new Promise(async (ok) => {
        const stream = ai.stream(
          'generate a 10 stanza haiku in JSONL format, where each line is like this: {"line":"..haiku line..."}',
          { format: 'jsonl' });

        for await (const r of stream) {
          console.log('r2->', r.delta.line);
        }
      })
    ]);
  });
});
