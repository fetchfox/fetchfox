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

});
