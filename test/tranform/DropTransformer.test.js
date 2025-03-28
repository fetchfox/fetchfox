import * as cheerio from 'cheerio';
import assert from 'assert';
import os from 'os';
import { fox } from '../../src/index.js';
import { DropTransformer } from '../../src/transform/DropTransformer.js';

describe('DropTransformer', function() {

  it('should drop middle for many nodes simple @fast', async () => {
    const dt = new DropTransformer();
    let html = '<main>';
    for (let i = 0; i < 100; i++) {
      html += `<div>${i}</div>\n`;
    }
    html += '</main>';
    const dHtml = await dt.transform(html);
    const $ = cheerio.load(dHtml);
    assert.ok($('div').length < 20);
  });

  it('should drop middle for many a b a b ... pattern @fast', async () => {
    const dt = new DropTransformer();
    let html = '<main>';
    for (let i = 0; i < 100; i++) {
      html += `<div class="a">${i}</div>\n`;
      html += `<div class="b"><span>${i}</span></div>\n`;
      if (i % 30 == 0) {
        html += `<div class="c"><b>KEEP ${i}</b></div>\n`;
      }
    }
    html += '</main>';
    const dHtml = await dt.transform(html);
    const $ = cheerio.load(dHtml);
    assert.ok($('div.a').length < 20, 'clip a');
    assert.ok($('div.b').length < 20, 'clip b');
    assert.ok($('div.c').length == 4, 'keep c');
  });

  it('should drop middle for many nodes nested @fast', async () => {
    const dt = new DropTransformer();

    let html = '<main>';

    html += '<section>';
    for (let i = 0; i < 100; i++) {
      html += `<div class="a">${i}</div>\n`;
    }
    html += '</section>';

    html += '<section>';
    for (let i = 0; i < 10; i++) {
      html += `<div class="b">${i}</div>\n`;
    }
    html += '</section>';

    html += '<section>';
    for (let i = 0; i < 100; i++) {
      html += `<div class="c">${i}</div>\n`;
    }
    html += '</section>';

    html += '</main>';

    const dHtml = await dt.transform(html);
    const $ = cheerio.load(dHtml);
    assert.ok($('.a').length < 20);
    assert.ok($('.b').length < 20);
    assert.ok($('.c').length < 20);
  });


  it('should keep different shapes @fast', async () => {
    const dt = new DropTransformer({ limit: 4 });
    let html = `<main>
<div><p>one</p></div>
<div><p><p>one</p></p></div>
<div><span><p>one</p></span></div>
<div><b><p>one</p></b></div>
<div><u><p>one</p></u></div>
</main>
`;
    const dHtml = await dt.transform(html);
    const $ = cheerio.load(dHtml);
    assert.equal($('main > *').length, 5);
  });

});
