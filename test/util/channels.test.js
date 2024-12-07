import assert from 'assert';
import os from 'os';
import { createChannel } from '../../src/util.js';

describe('channels', function() {

  it('should end properly @run', async () => {
    const c1 = createChannel();

    const p1 = new Promise(async (ok) => {
      for await (const v of c1.receive()) {
        if (v.end) break;
      }
      ok();
    });

    const p2 = new Promise(async (ok) => {
      for await (const v of c1.receive()) {
        if (v.end) break;
      }
      ok();
    });

    c1.send({ abc: 'xyz' });
    c1.end();

    await p1;
    await p2;

    const p3 = new Promise(async (ok) => {
      for await (const v of c1.receive()) {
        if (v.end) break;
        console.log(v);
      }
      ok();
    });

    await p3;

  });

});
