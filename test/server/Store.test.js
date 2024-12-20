import assert from 'assert';
import { Store } from '../../src/server/Store.js';

describe('Store', function () {
  it('should debounce @run', async () => {
    const data = {};
    const delayKv = {
      get: async (id) => {
        await new Promise((ok) => setTimeout(ok, Math.random() * 50));
        return data[id];
      },
      set: async (id, val) => {
        await new Promise((ok) => setTimeout(ok, Math.random() * 50));
        data[id] = val;
      },
    };

    const output = await new Promise(async (ok) => {
      const store = new Store(delayKv);
      await store.sub('key', ok);
      let n = 10;
      let p;
      for (let i = 0; i < n; i++) {
        p = store.pub('key', { abc: i });
      }
    });

    assert.equal(output.abc, 9);
  });
});
