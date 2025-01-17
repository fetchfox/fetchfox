import assert from 'assert';
import os from 'os';
import { Document } from '../../src/document/Document.js';
import { TagRemovingMinimizer } from '../../src/min/TagRemovingMinimizer.js';
import { largeHtml } from './largeHtml.js';

describe('TagRemovingMinimizer', function () {
  it('should remove tags simple @run @fast', async () => {
    const min = new TagRemovingMinimizer({
      removeTags: ['script', 'style'],
    });
    const html = `<body>keep this<script>remove this</script>keep this too<style>remove this</style></body>`;
    const doc = new Document();
    doc.loadData({ html });
    const docMin = await min.min(doc);

    assert.ok(docMin.html.indexOf('remove') == -1);
    assert.ok(docMin.html.indexOf('keep') != -1);
  });

  it('should remove tags large @run @fast', async () => {
    const min = new TagRemovingMinimizer({
      removeTags: ['script', 'style', 'svg', 'meta'],
    });
    const doc = new Document();
    doc.loadData({
      url: 'https://example.com',
      html: largeHtml,
    });
    const docMin = await min.min(doc);

    assert.ok(docMin.html.length < largeHtml.length);
  });
});
