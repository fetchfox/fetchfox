import * as cheerio from 'cheerio';
import assert from 'assert';
import os from 'os';
import { fox } from '../../src/index.js';
import { TextOnlyTransformer } from '../../src/transform/TextOnlyTransformer.js';

describe('TextOnlyTransformer', function() {

  it('should remove svg @fast', async () => {
    const tot = new TextOnlyTransformer();

    let html = `<div>text
<div>nested<div>nest 2.1</div><div>nest 2.2</div><div>nest 2.3</div>and back
</div>
</div>
`;

    const { html: text } = await tot.transform(html);
    assert.ok(!text.includes('<div>'));
  });

});
