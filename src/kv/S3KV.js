import { logger as defaultLogger } from '../log/logger.js';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { NodeHttpHandler } from "@smithy/node-http-handler";
import { BaseKV } from './BaseKV.js';

export const S3KV = class extends BaseKV {
  constructor(options) {
    super();
    this.logger = options.logger || defaultLogger;
    this.bucket = options.bucket;
    this.prefix = options.prefix || '';
    this.acl = options.acl;

    this.s3 = new S3Client({
      region: options.region,
      requestHandler: new NodeHttpHandler({
        requestTimeout: 10000,
        httpsAgent: { maxSockets: 200 },
      }),
    });
  }

  toString() {
    return `[${this.constructor.name}]`;
  }

  async set(key, val) {
    const objectKey = `${this.prefix}${key}`;
    const body = JSON.stringify(val);

    console.log('s3kv set', objectKey);

    try {
      await this.s3.send(new PutObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
        Body: body,
        ACL: this.acl,
        ContentType: 'application/json',
      }));
      this.logger.info(`${this} Successfully set key: ${this.url(objectKey)}`);
    } catch (e) {
      this.logger.error(`${this} Error while setting key ${this.url(objectKey)}: ${e}`);
      throw e;
    }
  }

  async get(key) {
    const objectKey = `${this.prefix}${key}`;

    console.log('s3kv get', objectKey);

    let body;
    try {
      const resp = await this.s3.send(new GetObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
      }));
      body = await this.streamToString(resp.Body);
      console.log('BODY', body);

    } catch (e) {
      if (e.name == 'NoSuchKey') {
        return undefined;
      }
      this.logger.error(`${this} Error reading key ${this.url(objectKey)}: ${e}`);
      throw e;
    }

    try {
      const p = JSON.parse(body);
      console.log('p', p);
      return p;
    } catch (e) {
      this.logger.warn(`${this} Failed to parse JSON for key ${this.url(objectKey)}: ${e}`);
      await this.del(key);
      return undefined;
    }

  }

  async del(key) {
    const objectKey = `${this.prefix}${key}`;
    try {
      await this.s3.send(new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
      }));
      this.logger.info(`${this} Successfully deleted key: ${this.url(objectKey)}`);
    } catch (e) {
      if (e.name == 'NoSuchKey') return;
      this.logger.error(`${this} Error deleting key ${this.url(objectKey)}: ${e}`);
      throw e;
    }
  }

  async streamToString(stream) {
    const chunks = [];
    try {
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
    } catch (e) {
      this.logger.error(`${this} Error streaming data: ${e}`);
    }
    return Buffer.concat(chunks).toString('utf-8');
  }

  url(objectKey) {
    return `https://${this.bucket}.s3.amazonaws.com/${objectKey}`;
  }
}
