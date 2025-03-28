import * as cheerio from 'cheerio';
import assert from 'assert';
import os from 'os';
import { fox } from '../../src/index.js';
import { TagsTransformer } from '../../src/transform/TagsTransformer.js';

describe('TagsTransformer', function() {

  it('should remove attributes @fast', async () => {
    const tt = new TagsTransformer(['srcset']);

    let html = `
<div class="tile padding-top-16 padding-left-16 padding-right-16">
  <div class="left-col"><a tabindex="0" href="/shop/connecticut/curaleaf-ct-stamford/products/67d464aa87e9a73b607e3755" class="image pointer"><img data-test="default-product-img" alt="Select Elite Cartridge NYC Diesel (H) 00553" loading="lazy" decoding="async" data-nimg="fill" class="product-img" sizes="100%" srcset="/_next/image?url=https%3A%2F%2Fimages.dutchie.com%2F9481d8de2e85e88b3f61e69d0b52abbb&amp;w=16&amp;q=75 16w, /_next/image?url=https%3A%2F%2Fimages.dutchie.com%2F9481d8de2e85e88b3f61e69d0b52abbb&amp;w=32&amp;q=75 32w, /_next/image?url=https%3A%2F%2Fimages.dutchie.com%2F9481d8de2e85e88b3f61e69d0b52abbb&amp;w=48&amp;q=75 48w, /_next/image?url=https%3A%2F%2Fimages.dutchie.com%2F9481d8de2e85e88b3f61e69d0b52abbb&amp;w=64&amp;q=75 64w, /_next/image?url=https%3A%2F%2Fimages.dutchie.com%2F9481d8de2e85e88b3f61e69d0b52abbb&amp;w=96&amp;q=75 96w, /_next/image?url=https%3A%2F%2Fimages.dutchie.com%2F9481d8de2e85e88b3f61e69d0b52abbb&amp;w=128&amp;q=75 128w, /_next/image?url=https%3A%2F%2Fimages.dutchie.com%2F9481d8de2e85e88b3f61e69d0b52abbb&amp;w=256&amp;q=75 256w, /_next/image?url=https%3A%2F%2Fimages.dutchie.com%2F9481d8de2e85e88b3f61e69d0b52abbb&amp;w=384&amp;q=75 384w, /_next/image?url=https%3A%2F%2Fimages.dutchie.com%2F9481d8de2e85e88b3f61e69d0b52abbb&amp;w=640&amp;q=75 640w, /_next/image?url=https%3A%2F%2Fimages.dutchie.com%2F9481d8de2e85e88b3f61e69d0b52abbb&amp;w=750&amp;q=75 750w, /_next/image?url=https%3A%2F%2Fimages.dutchie.com%2F9481d8de2e85e88b3f61e69d0b52abbb&amp;w=828&amp;q=75 828w, /_next/image?url=https%3A%2F%2Fimages.dutchie.com%2F9481d8de2e85e88b3f61e69d0b52abbb&amp;w=1080&amp;q=75 1080w, /_next/image?url=https%3A%2F%2Fimages.dutchie.com%2F9481d8de2e85e88b3f61e69d0b52abbb&amp;w=1200&amp;q=75 1200w, /_next/image?url=https%3A%2F%2Fimages.dutchie.com%2F9481d8de2e85e88b3f61e69d0b52abbb&amp;w=1920&amp;q=75 1920w, /_next/image?url=https%3A%2F%2Fimages.dutchie.com%2F9481d8de2e85e88b3f61e69d0b52abbb&amp;w=2048&amp;q=75 2048w, /_next/image?url=https%3A%2F%2Fimages.dutchie.com%2F9481d8de2e85e88b3f61e69d0b52abbb&amp;w=3840&amp;q=75 3840w" src="/_next/image?url=https%3A%2F%2Fimages.dutchie.com%2F9481d8de2e85e88b3f61e69d0b52abbb&amp;w=3840&amp;q=75"></a>
    <div class="product-details">
      <div class="d-flex justify-content-between align-items-center"></div>
      <div data-test="brand" class="margin-top-8"><span class="text-black body-l font-medium">Select by Curaleaf</span></div><a tabindex="0" href="/shop/connecticut/curaleaf-ct-stamford/products/67d464aa87e9a73b607e3755">
        <h2 class="margin-top-8 product-name text-black margin-0 body-xl">Select Elite Cartridge NYC Diesel (H) 00553</h2>
      </a>
      <div class="moodi-day-rating-overlay margin-top-4" data-productid="67d464aa87e9a73b607e3755"></div>
      <div class="product-options margin-top-8"><span class="single-variant body-l font-bold text-black">1g</span></div>
      <div class="product-additional-info"><span class="body-sm font-medium">86.78% Total THC</span></div>
    </div>
  </div>
</div>
`;

    const tHtml = await tt.transform(html);
    assert.ok(!tHtml.includes('srcset'));
  });

  it('should remove svg @fast', async () => {
    const tt = new TagsTransformer(['srcset']);

    let html = `
<div class="tile padding-top-16 padding-left-16 padding-right-16">
<svg>stuff</svg>
</div>
`;

    const tHtml = await tt.transform(html);
    console.log('tHtml', tHtml);
    assert.ok(tHtml.includes('<div class="tile padding-top-16 padding-left-16 padding-right-16">'));
    assert.ok(!tHtml.includes('<svg>stuff</svg>'));
  });

});
