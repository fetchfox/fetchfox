import os from 'os';
import fs from 'fs';
import assert from 'assert';
import process from 'node:process';
import { fox } from '../../src/index.js';

process.on('unhandledRejection', async (reason, p) => {
  console.log('Unhandled Rejection at:', p, 'reason:', reason);
  process.exit(1);
});

describe('chia-anime.su', function() {
  this.timeout(0);

  it('should work', async () => {
    const f = await fox
      .config({
        fetcher: ['playwright', { headless: false } ],
        diskCache: os.tmpdir() + '/fetchfox-text-cache',
      });

    let countPartials = 0;

    const filepath = os.tmpdir() + '/fetchfox-test-chia-anime.jsonl';
    const out = await f
      .init('https://chia-anime.su/')
      .extract({
        url: 'What is the URL of this anime video?',
        title: 'What is the title of this anime video?',
      })
      .limit(5)
      .exportItems(filepath)
      .run(null, (partial) => {
        const { item, results } = partial;
        countPartials++;
      });

    assert.equal(countPartials, 5);
    assert.equal(out.length, 5);

    // Sanity check results, most of the results will have 'Subbed' in the title
    assert.ok(out
      .filter(item => item.title.toLowerCase().indexOf('subbed') != -1)
      .length > 0);

    // New section to check that the output file has 5 rows
    const rows = fs.readFileSync(filepath, 'utf-8')
      .split('\n')
      .map(x => {
        let item;
        try {
          item = JSON.parse(x);
        } catch(e) {
          console.log(`Couldn't parse: ${x}`);
        }
        assert.ok(item.url);
        assert.ok(item.title);
        return item;
      });
    
    assert.equal(rows.length, 5);
  });
});
