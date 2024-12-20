import assert from 'assert';
import os from 'os';
import { createChannel } from '../../src/util.js';

describe('channels', function () {
  it('should send and receive @run', async () => {
    const c1 = createChannel();
    const c2 = createChannel();

    c1.send({ seq: 1 });
    c1.send({ seq: 2 });

    c2.send({ seq: 10 });
    c2.send({ seq: 20 });

    const got = [];

    (async () => {
      c1.end();
      c2.end();
    })();

    for await (const msg of c1.receive()) {
      if (msg.end) break;
      got.push(msg);
    }

    for await (const msg of c2.receive()) {
      if (msg.end) break;
      got.push(msg);
    }

    assert.equal(got.length, 4);
    assert.equal(got[0].seq, 1);
    assert.equal(got[1].seq, 2);
    assert.equal(got[2].seq, 10);
    assert.equal(got[3].seq, 20);
  });

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
      }
      ok();
    });

    await p3;
  });

  it('should send all messages before end @run', async () => {
    const c = createChannel();

    const got = [];

    const p = new Promise(async (ok) => {
      for await (const v of c.receive()) {
        if (v.end) break;
        got.push(v);
      }
      ok();
    });

    c.send({ seq: 1 });
    c.send({ seq: 2 });
    c.send({ seq: 3 });
    c.end();

    await p;

    assert.equal(got.length, 3);
    assert.equal(got[0].seq, 1);
    assert.equal(got[1].seq, 2);
    assert.equal(got[2].seq, 3);
  });
});
