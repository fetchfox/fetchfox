import os from 'os';
import fs from 'fs';
import assert from 'assert';
import process from 'node:process';
import { Document } from '../../src/document/Document.js';
import { fox } from '../../src/index.js';
import { sample } from './data/chia-anime-sample.html.js';

describe('chia-anime.su', function() {
  this.timeout(60 * 1000);

  it('should work for simple crawl', async () => {
    const f = await fox
      .config({
        fetcher: ['playwright', { headless: true } ],
        diskCache: os.tmpdir() + '/fetchfox-test-cache',
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
        }
        assert.ok(item.url);
        assert.ok(item.title);
        return item;
      });
    
    assert.equal(rows.length, 5);
  });

  it('should work for complex crawl', async () => {
    const f = await fox
      .config({
        fetcher: ['playwright', { headless: true } ],
        diskCache: os.tmpdir() + '/fetchfox-test-cache',
      });

    const out = await f
      .init('https://chia-anime.su/')
      .crawl('find links to animes videos')
      .limit(5)
      .extract({
        'title': 'title of the anime video',
        'video_url': 'Url of the anime video iframe embed',
        single: true,
      })
      .run();

    assert.equal(
      out
        .filter(item => item.video_url.indexOf('en.embedz.net/watch?v=') != -1)
        .length,
      5);
  });

  it('should work extract from the sample', async () => {
    const doc = new Document();
    doc.loadData({ html: sample });
    
    const result = await fox
      .init(doc)
      .extract({
        'title': 'title of the anime video',
        'video_url': 'Url of the anime video inside the iframe, MUST start with https://vid.embedz.net/directlink/source_cpanel/embed.php',
        single: true,
      })
      .run();

    assert.equal(
      result[0].video_url,
      `https://vid.embedz.net/directlink/source_cpanel/embed.php?data=q96F7jdq2QFdRiT+YaaFCmyZHvKIFPliqya1pejOCTs++581vUUry2Q5bfJ/chlm40a32sAma+um6kZri5UHgu4RevLIFmfbE6b+pk0WUsXj1dlTK6IPh2F3aGLzSHBBv4VhDHCJ5iDoS3eZLtV0o5uo7oXr`);
  });

  it('should get iframe code', async () => {
    const out = await fox
      .config({
        fetcher: ['playwright', { headless: true } ],
      })
      .init('https://chia-anime.su/tasuketsu-episode-15-english-subbed')
      .fetch()
      .run();

    const html = out[0].source().html;
    const index = html.indexOf('https://vid.embedz.net/directlink/source_cpanel/embed.php');

    assert.ok(index != -1, 'expect iframe html');
  });

});
