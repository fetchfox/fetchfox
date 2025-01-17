import assert from 'assert';
import os from 'os';
import process from 'node:process';
import { fox } from '../../src/index.js';

describe('political-ads-leadgen', function () {
  this.timeout(10 * 60 * 1000);

  it('should find leads', async () => {
    const diskCache = os.tmpdir() + '/fetchfox-test-cache';

    const f = await fox
      .config({
        diskCache,
        fetcher: ['playwright', { headless: true, wait: 4000 }],
      })
      .init([
        'https://www.google.com/search?q=alabama+political+ad+agencies',
        'https://www.google.com/search?q=alabama+political+ad+agencies&start=10',
      ])
      .crawl({
        query:
          'find links to earch results linking to ad agency companies. offsite search results only, not the ones on google.com.',
        limit: 20,
      })
      .extract({
        type: 'Is this page a specfic ad agency, or a list of more ad agencies? Answer exactly one of these: "company" or "links"',
        single: true,
      });
    const r = await f.run();

    const linkUrls = [];
    const companyUrls = [];
    for (const item of r.items) {
      if (item.type == 'company') {
        companyUrls.push(item.url);
      } else {
        linkUrls.push(item.url);
      }
    }

    const f2 = await fox
      .config({
        diskCache,
        fetcher: ['playwright', { headless: true, wait: 4000 }],
      })
      .init(linkUrls)
      .crawl({
        query: 'Find links to ad agencies. Only ad agencies, no navigation, and ONLY off-site links',
        limit: 10,
      })
      .extract({
        type: 'Is this page a specfic ad agency, or a list of more ad agencies? Answer exactly one of these: "company" or "links"',
        company_name: 'What is the name of this company?',
        single: true,
      });
    const r2 = await f2.run();
    for (const item of r2.items) {
      if (item.type == 'company') {
        companyUrls.push(item.url);
      }
    }

    const f3 = await fox
      .config({
        diskCache,
        fetcher: ['playwright', { headless: true, wait: 4000 }],
      })
      .init(companyUrls)
      .extract({
        company_name: 'What is the name of this company?',
        email: 'Find the email address of this company, if available',
        phone: 'Find the phone number of this company, if available',
        contact_us_url: 'Find the contact page URL this company, if available. Format: Full absolute URL',
        single: true,
      });
    const r3 = await f3.run();
    const contactUrls = [];
    for (const item of r3.items) {
      contactUrls.push(item.contact_us_url);
    }

    const f4 = await fox
      .config({
        diskCache,
        fetcher: ['playwright', { headless: true, wait: 4000 }],
      })
      .init(contactUrls)
      .extract({
        company_name: 'What is the name of this company?',
        email: 'Find the email address of this company, if available',
        phone: 'Find the phone number of this company, if available',
        contact_us_url: 'Find the contact page URL this company, if available. Format: Full absolute URL',
        single: true,
      });

    const r4 = await f4.run();

    let validEmails = 0;
    let validPhones = 0;

    for (const item of r4.items) {
      if (item.email.indexOf('@') != -1) {
        validEmails++;
      }
      if (item.phone.replace(/[^0-9]/g, '').length == 10) {
        validPhones++;
      }
    }

    assert.ok(validEmails > 3 && validEmails < 20, 'sanity check emails found');
    assert.ok(validPhones > 3 && validPhones < 20, 'sanity check phones found');
  });
});
