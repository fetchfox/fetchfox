import assert from 'assert';
import path, { dirname } from 'path';
import fs from 'fs';
import os from 'os';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getFetcher } from '../../src/index.js';
import { Document } from '../../src/document/Document.js';
import { largeHtml } from './largeHtml.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Document', function() {

  it('should diff', async () => {
    const leftPath = path.join(__dirname, '../data/documents/startops-left.html');
    const left = fs.readFileSync(leftPath, 'utf8');
    const rightPath = path.join(__dirname, '../data/documents/startops-right.html');
    const right = fs.readFileSync(rightPath, 'utf8');

    const docL = new Document();
    const docR = new Document();
    docL.loadData({ html: left });
    docR.loadData({ html: right });
    const diff = docL.diff(docR);

    assert.ok(docR.html.length > 10000);
    assert.ok(diff.html.length < 20000);
  });
  
});
