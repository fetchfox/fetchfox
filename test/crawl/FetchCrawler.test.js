import { expect } from 'chai';
import { FetchCrawler } from '../../src/crawl/FetchCrawler.js';

describe('FetchCrawler', () => {
  it('should get a document', async () => {
    const crawler = new FetchCrawler();
    const doc = await crawler.fetch('https://fetchfoxai.com');

    expect(doc.html).to.include('<title>');
    expect(doc.text).to.include('FetchFox');
    expect(doc.links
      .filter(link => link.url.indexOf('chromewebstore.google.com'))
      .length)
      .to.be.above(0);
  });
});
