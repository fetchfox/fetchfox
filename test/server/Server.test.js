import assert from 'assert';
import { fox } from '../../src/index.js';
import { webfox } from '../../src/web.js';
import { Server } from '../../src/server/Server.js';
import { RemoteWorkflow } from '../../src/workflow/RemoteWorkflow.js';
import { Client } from '../../src/relay/Client.js';
import { googleSearchPlanPrompt } from './data.js';
import { setShouldIgnore } from '../setup.js';
import { testDiskCachePath } from '../lib/util.js';

describe('Server', function() {
  this.timeout(10 * 1000);

  const diskCache = testDiskCachePath;

  this.launch = async () => {
    const s = new Server({ childPath: 'src/server/child.js', context: { diskCache } });
    await new Promise(ok => s.listen(7070, ok));
    this.s = s;
    return s;
  }

  afterEach(() => {
    if (this.s) {
      this.s.close();
    }
  });

  it('should serve and run @run', async () => {
    const s = await this.launch(); 

    const rw = new RemoteWorkflow()
      .config({
        diskCache,
        host: 'http://127.0.0.1:7070',
      });

    let partial;
    const out = await rw
      .init('https://pokemondb.net/pokedex/national')
      .extract({
        questions: {
          name: 'Pokemon name, starting with first pokemon',
          type: 'Pokemon type',
          number: 'Pokedex number',
        },
        single: false })
      .limit(3)
      .run(
        null,
        (p) => {
          partial = p;
        });

    await new Promise(ok => setTimeout(ok, 200));

    s.close();

    assert.equal(out.items.length, 3);
    assert.equal(partial.items.length, 3);
    assert.equal(out.items[0].name, 'Bulbasaur');
    assert.equal(out.items[1].name, 'Ivysaur');
    assert.equal(out.items[2].name, 'Venusaur');
  });

  it('should handle global limit in config @run', async () => {
    const s = await this.launch(); 

    const rw = new RemoteWorkflow()
      .config({
        diskCache,
        host: 'http://127.0.0.1:7070',
        limit: 3,
        publishAllSteps: true,
      });

    let partial;
    const out = await rw
      .init('https://pokemondb.net/pokedex/national')
      .extract({
        questions: {
          name: 'Pokemon name, starting with first pokemon',
          type: 'Pokemon type',
          number: 'Pokedex number',
        },
        single: false })
      .run(
        null,
        (p) => {
          partial = p;
        });

    s.close();

    assert.equal(out.items.length, 3);
    assert.equal(partial.items.length, 3);
  });


  it('should use global limit in load @run', async () => {
    const s = await this.launch(); 

    const data = {
      "options": {
        "limit": 3,
      },
      "steps": [
        {
          "name": "const",
          "args": {
            "items": [
              {
                "url": "https://thehackernews.com/"
              }
            ]
          }
        },
        {
          "name": "crawl",
          "args": {
            "query": "Find links to articles about malware and other vulnerabilities",
          }
        },
        {
          "name": "extract",
          "args": {
            "questions": {
              summary: "Summarize the malware/vulnerability in 5-20 words",
              technical: "What are the technical identifiers like filenames, indicators of compromise, etc.?",
              url: "What is the URL? Format: Absolute URL"
            }
          }
        }
      ],
    };

    const wf = webfox;
    const out = await wf
      .config({
        diskCache,
        host: 'http://127.0.0.1:7070',
      })
      .run(data);

    s.close();

    assert.equal(out.items.length, 3);
  });

  it('should start and sub @run', async () => {
    const s = await this.launch(); 

    const rw = new RemoteWorkflow()
      .config({
        diskCache,
        host: 'http://127.0.0.1:7070',
      });

    let partial;
    const id = await rw
      .init('https://pokemondb.net/pokedex/national')
      .extract({
        questions: {
          name: 'Pokemon name, starting with first pokemon',
          type: 'Pokemon type',
          number: 'Pokedex number',
        },
        single: false })
      .limit(3)
      .start();

    const out = await rw.sub(
      id,
      (p) => {
        partial = p;
      });

    assert.ok(!!out);
    assert.equal(out.items.length, 3);
    assert.equal(partial.items.length, 3);
    assert.equal(out.items[0].name, 'Bulbasaur');
    assert.equal(out.items[1].name, 'Ivysaur');
    assert.equal(out.items[2].name, 'Venusaur');

    s.close();
  });

  it('should replay results on re-connect @run', async () => {
    const s = await this.launch(); 

    const rw = new RemoteWorkflow()
      .config({
        diskCache,
        host: 'http://127.0.0.1:7070',
      });

    let id;
    const partials = [];
    const out = await rw
      .init('https://pokemondb.net/pokedex/national')
      .extract({
        questions: {
          name: 'Pokemon name, starting with first pokemon',
          type: 'Pokemon type',
          number: 'Pokedex number',
        },
        single: false })
      .limit(1)
      .run(
        null,
        (partial) => {
          id = partial.id;
          partials.push(partial.item);
        });


    assert.ok(!!out);
    assert.equal(out.items.length, 1);
    assert.equal(partials.length, 1);

    assert.equal(out.items[0].name, 'Bulbasaur');

    const partials2 = [];
    const out2 = await rw.sub(id, () => {});

    assert.equal(
      JSON.stringify(out2),
      JSON.stringify(out));

    assert.equal((s.store[id] || []).length, 0);

    s.close();
  });

  it('should partial replay results on re-connect @disabled @long @broken', async () => {
    const s = await this.launch(); 

    const rw = new RemoteWorkflow()
      .config({
        diskCache,
        host: 'http://127.0.0.1:7070',
      });

    let id;
    const partials = [];

    // Do *not* wait for full results
    rw
      .init('https://pokemondb.net/pokedex/national')
      .extract({
        questions: {
          name: 'Pokemon name, starting with first pokemon',
          type: 'Pokemon type',
          number: 'Pokedex number',
        },
        single: false })
      .limit(10)
      .run(
        null,
        (partial) => {
          id = partial.id;
          partials.push(partial.item);
        });

    const waitForNum = 5;
    for (let i = 0; i < 30; i++) {
      await new Promise(ok => setTimeout(ok, 1000));
      if (partials.length >= waitForNum) break;
    }

    let stream2;
    const partials2 = await new Promise((ok) => {
      stream2 = rw.sub(id, (partial) => {
        ok(partial);
      });
    });

    assert.ok(partials2.items.length >= waitForNum, 'expect replay');
    assert.ok(partials2.items.length < 10, 'expect not finished');

    const out2 = await stream2;

    assert.equal(out2.items.length, 10);

    s.close();
    
  });

  it('should run json @run', async () => {
    const s = await this.launch(); 

    const wf = webfox;
    const out = await wf
      .config({
        diskCache,
        host: 'http://127.0.0.1:7070',
      })
      .run(
        {
          "steps": [
            {
              "name": "const",
              "args": {
                "items": [
                  {
                    "url": "https://pokemondb.net/pokedex/national"
                  }
                ]
              }
            },
            {
              "name": "extract",
              "args": {
                "questions": {
                  "name": "What is the name of the Pokémon?",
                  "type": "What is the type of the Pokémon?"
                },
                "single": false
              }
            },
            {
              "name": "limit",
              "args": {
                "limit": "3"
              }
            },
          ]
        },
        (partial) => {});

    s.close();

    assert.equal(out.items.length, 3);
    assert.equal(out.items[0].name, 'Bulbasaur');
    assert.equal(out.items[1].name, 'Ivysaur');
    assert.equal(out.items[2].name, 'Venusaur');
  });


  it('should get same results as local @run', async () => {
    const s = await this.launch(); 

    const run = fox
      .config({ diskCache })
      .init('https://pokemondb.net/pokedex/national')
      .extract({
        questions: {
          name: 'Pokemon name, starting with first pokemon',
          type: 'Pokemon type',
          number: 'Pokedex number',
        },
        single: false })
      .limit(3)
      .run();

    const rw = new RemoteWorkflow()
      .config({
        diskCache,
        host: 'http://127.0.0.1:7070',
      });
    const rwRun = rw
      .init('https://pokemondb.net/pokedex/national')
      .extract({
        questions: {
          name: 'Pokemon name, starting with first pokemon',
          type: 'Pokemon type',
          number: 'Pokedex number',
        },
        single: false })
      .limit(3)
      .run();

    const [local, remote] = await Promise.all([run, rwRun]);

    s.close();

    assert.equal(local.items.length, 3);
    assert.equal(local.items[0].name, 'Bulbasaur');
    assert.equal(local.items[1].name, 'Ivysaur');
    assert.equal(local.items[2].name, 'Venusaur');

    assert.equal(remote.items.length, 3);
    assert.equal(remote.items[0].name, 'Bulbasaur');
    assert.equal(remote.items[1].name, 'Ivysaur');
    assert.equal(remote.items[2].name, 'Venusaur');

    assert.equal(remote.items.length, local.items.length);
    assert.equal(remote.items[0].name, local.items[0].name);
    assert.equal(remote.items[1].name, local.items[1].name);
    assert.equal(remote.items[2].name, local.items[2].name);
  });

  it('should plan @run', async () => {
    const s = await this.launch(); 

    const rw = new RemoteWorkflow()
      .config({
        diskCache,
        host: 'http://127.0.0.1:7070',
      });
    const workflow = await rw.plan('https://pokemondb.net/pokedex/national find links to pokemon pages and extract names');

    s.close();

    assert.equal(workflow.steps.length, 3);
    assert.equal(workflow.steps[0].name, 'const');
    assert.equal(workflow.steps[1].name, 'crawl');
    assert.equal(workflow.steps[2].name, 'extract');
  });

  // Disabled because cached results return too fast for stop()
  // TODO: Verify stop works somet other way
  it('should stop @disabled', async () => {
    setShouldIgnore(false);
    try {
      const s = await this.launch();

      const rw = new RemoteWorkflow()
        .config({
          diskCache,
          host: 'http://127.0.0.1:7070',
        });

      let stopOut;
      const partials = [];

      const f = rw
        .init('https://pokemondb.net/pokedex/national')
        .extract({
          questions: {
            name: 'Pokemon name, starting with first pokemon',
            type: 'Pokemon type',
            number: 'Pokedex number',
          },
          single: false })
        .limit(3)
        .run(
          null,
          async (partial) => {
            partials.push(partial.item);
            rw.stop();
          });

      const final = await f;

      s.close();

      assert.equal(final.items.length, 1);
      assert.equal(final.items[0].name, 'Bulbasaur');
      assert.equal(final.full[2].items[0].name, 'Bulbasaur');

      assert.ok(final.full[0].done);
      assert.ok(final.full[1].done);
      assert.ok(final.full[2].done);
    } finally {
      setShouldIgnore(true);
    }
  });

  it('should publish all steps @run', async () => {
    const s = await this.launch(); 

    const rw = new RemoteWorkflow()
      .config({
        diskCache,
        host: 'http://127.0.0.1:7070',
        publishAllSteps: true,
      });

    let partial;
    const final = await rw
      .init('https://pokemondb.net/pokedex/national')
      .extract({
        questions: {
          name: 'Pokemon name, starting with first pokemon',
          type: 'Pokemon type',
          number: 'Pokedex number',
        },
        single: false })
      .limit(3)
      .run(
        null,
        (p) => {
          partial = p;
        });

    s.close();

    assert.equal(partial.full.length, 3);
  });

  it('should ping pong @run', async () => {
    const s = await this.launch();
    const client = new Client('ws://127.0.0.1:7070');
    const id = await client.connect();

    const timeout = setTimeout(
      () => assert.ok(false, 'ping timeout'),
      1000);

    await new Promise(ok => client.ping(() => {
      clearTimeout(timeout);
      s.close();
      client.close();
      ok();
    }));

  });

  it('should relay one @run', async () => {
    const s = await this.launch();

    const rec = new Client('ws://127.0.0.1:7070', { name: 'REC', shouldReply: true });
    const id = await rec.connect();

    rec.listen((data) => data.text + ' and reply' );

    const sender = new Client('ws://127.0.0.1:7070', { name: 'SENDER' });
    await sender.connect(id);

    const reply = await new Promise(
      ok => sender.send({ text: 'original' }, ok)
    );

    assert.equal(reply, 'original and reply');

    rec.close();
    sender.close();
    s.close();
  });


  it('should relay many @run', async () => {
    // Test is for race condition, so run many times
    for (let i = 0; i < 50; i++) {
      const s = await this.launch();
      const rec = new Client('ws://127.0.0.1:7070', { name: 'REC', shouldReply: true });
      const id = await rec.connect();
      rec.listen((data) => data.text + ' and reply' );

      const sender1 = new Client('ws://127.0.0.1:7070', { name: 'sender1' });
      let sender2;
      const sender3 = new Client('ws://127.0.0.1:7070', { name: 'sender3' });
      const sender4 = new Client('ws://127.0.0.1:7070', { name: 'sender4' });
      await sender1.connect(id);
      await sender3.connect(id);
      await sender4.connect(id);

      const [
        reply1,
        reply2,
        reply3,
        reply4,
      ] = await Promise.all([
        new Promise(ok => sender1.send({ text: 'original1' }, ok)),
        new Promise(ok => {
          setTimeout(
            async () => {
              sender2 = new Client('ws://127.0.0.1:7070', { name: 'sender2' });
              await sender2.connect(id);
              sender2.send(
                { text: 'original2' },
                (replyData) => {
                  ok(replyData);
                });
            },
            100)
        }),
        new Promise(ok => sender3.send({ text: 'original3' }, ok)),
        new Promise(ok => sender4.send({ text: 'original4' }, ok)),
      ]);

      assert.equal(reply1, 'original1 and reply');
      assert.equal(reply2, 'original2 and reply');
      assert.equal(reply3, 'original3 and reply');
      assert.equal(reply4, 'original4 and reply');

      rec.close();
      sender1.close();
      sender2.close();
      sender3.close();
      sender4.close();
      s.close();
    }
  });

  it('should reconnect relay @run', async () => {
    let s = await this.launch();
    const rec = new Client('ws://127.0.0.1:7070', { shouldReply: true, reconnect: true });
    const id = await rec.connect();
    rec.listen((data) => data.text + ' and reply' );

    for (const ws of s.conns) {
      ws.close(1000);
    }

    s.close();

    // Wait before restarting the server
    await new Promise(ok => setTimeout(ok, 2000));

    s = await this.launch();

    // Give enough time for reconnection
    // TODO: Server should buffer messages in case of reconnection
    await new Promise(ok => setTimeout(ok, 5000));

    const sender = new Client('ws://127.0.0.1:7070');
    await sender.connect(id);
    const reply = await new Promise(
      ok => {
        sender.send({ text: 'original' }, ok)
      });

    assert.equal(reply, 'original and reply');

    rec.close();
    sender.close();
    s.close();
  });

  it('should plan with html @run', async () => {
    const s = await this.launch(); 

    const rwf = new RemoteWorkflow()
      .config({ host: 'http://127.0.0.1:7070' });

    const cases = [
      [
        {
          url: 'https://www.reddit.com/r/nfl/',
          prompt: 'scrape articles',
        },
        'nfl',
      ],
      [
        {
          url: 'https://www.reddit.com/r/nfl/',
          prompt: '',
        },
        'nfl'
      ],
    ]

    for (const [args, expectedStr] of cases) {
      await rwf.plan({ ...args });
      await rwf.describe();

      assert.ok(
        rwf.name.toLowerCase().indexOf(expectedStr) != -1,
        'name should contain nfl');
      assert.ok(
        rwf.description.toLowerCase().indexOf(expectedStr) != -1,
        'description should contain nfl');
    }

    s.close();
  });

  it('should plan google shopping search @run', async () => {
    const s = await this.launch();

    const rw = new RemoteWorkflow()
      .config({
        diskCache,
        host: 'http://127.0.0.1:7070',
        publishAllSteps: true,
      });

    const rwf = await rw.plan(googleSearchPlanPrompt.prompt[0]);

    s.close();

    assert.equal(
      rwf.steps[0].args.items[0].url,
      googleSearchPlanPrompt.prompt[0].url);
  });


  it('should support s3 presigned urls @run', async () => {
    const s = await this.launch();

    const rec = new Client('ws://127.0.0.1:7070', { shouldReply: true });
    const id = await rec.connect();

    rec.listen((data) => data.text + ' and reply' );

    const sender = new Client('ws://127.0.0.1:7070');
    await sender.connect(id);

    const reply = await new Promise(
      ok => sender.send({ text: 'original' }, ok)
    );

    assert.equal(reply, 'original and reply');

    rec.close();
    sender.close();
    s.close();
  });

  it('should support middleware end @run', async () => {
    const s = await this.launch();

    s.pushMiddleware((data) => {
      return { end: 'middleware end' };
    });

    const rw = new RemoteWorkflow()
      .config({
        diskCache,
        host: 'http://127.0.0.1:7070',
      });

    const partials = [];
    const out = await rw
      .init('https://pokemondb.net/pokedex/national')
      .extract({
        questions: {
          name: 'Pokemon name, starting with first pokemon',
          type: 'Pokemon type',
          number: 'Pokedex number',
        },
        single: false })
      .limit(3)
      .run(
        null,
        (partial) => {
          partials.push(partial.item);
        });

    s.close();

    assert.equal(out, 'middleware end');

  });

});
