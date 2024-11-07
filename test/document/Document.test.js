import assert from 'assert';
import os from 'os';
import { getFetcher } from '../../src/index.js';
import { Document } from '../../src/document/Document.js';

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

describe('Document', function() {
  this.timeout(60 * 1000);

  it('should support s3', async () => {
    const fetcher = getFetcher();
    const url = 'https://ffcloud.s3.us-west-2.amazonaws.com/testdata/google-shopping-search.html';
    const doc = await fetcher.fetch(url);

    const s3 = new S3Client();
    const bucket = 'ffcloud';
    const key = 'testout/document-s3-upload.html';
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: 'text/html',
      ACL: 'public-read',
    });
    const presignedUrl = await getSignedUrl(
      s3,
      command,
      { expiresIn: 30 * 60 });

    await doc.uploadHtml(presignedUrl);

    const region = await s3.config.region();
    const outUrl = `https://ffcloud.s3.${region}.amazonaws.com/${key}`;
    const docOut = await fetcher.fetch(outUrl);
    assert.equal(docOut.html, doc.html);
  });

  it('should dump to s3', async () => {
    const fetcher = getFetcher();
    const url = 'https://ffcloud.s3.us-west-2.amazonaws.com/testdata/old-reddit-nfl-comment-page.html';
    const doc = await fetcher.fetch(url);

    const s3 = new S3Client();
    const bucket = 'ffcloud';
    const key = 'testout/document-s3-upload.html';
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: 'text/html',
      ACL: 'public-read',
    });
    const presignedUrl = await getSignedUrl(
      s3,
      command,
      { expiresIn: 30 * 60 });

    const data = await doc.dump({ presignedUrl });

    assert.ok(!data.body, 'no body');
    assert.ok(!data.html, 'no html');
    assert.ok(!data.text, 'no text');
    assert.ok(!data.links, 'no links');
    assert.ok(JSON.stringify(data).length < 10000, 'under 10kB');
    assert.equal(
      data.htmlUrl,
      'https://ffcloud.s3.us-west-2.amazonaws.com/testout/document-s3-upload.html');

    const docOut = await fetcher.fetch(data.htmlUrl);
    assert.equal(docOut.html, doc.html);

    const docLoad = new Document();
    await docLoad.loadData(data);
    assert.equal(docLoad.body, doc.body);
    assert.equal(docLoad.html, doc.html);
    assert.equal(docLoad.text, doc.text);
    assert.equal(docLoad.url, doc.url);
    assert.equal(docLoad.links.length, doc.links.length);
  });

});
