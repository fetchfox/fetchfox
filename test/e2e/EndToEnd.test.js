import { expect } from 'chai';
import { Fetcher } from '../../src/fetch/Fetcher.js';

describe('EndToEnd', () => {
  it('should fetch a page', async () => {
    const ft = new Fetcher();
    const doc = await ft.fetch('https://fetchfoxai.com');

    expect(doc.html).to.include('<title>');
    expect(doc.text).to.include('FetchFox');
    expect(doc.links
      .filter(link => link.url.indexOf('chromewebstore.google.com'))
      .length)
      .to.be.above(0);
  });
});
