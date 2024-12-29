import { logger } from '../log/logger.js';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { NodeHttpHandler } from "@smithy/node-http-handler";
import { Readable } from 'stream';
import https from 'https';

export const S3Cache = class {
  constructor(options) {
    this.bucket = options.bucket;
    this.prefix = options.prefix;
    this.prefix = options.prefix;
    this.acl = options.acl;
    this.ttls = options.ttls || { base: 2 * 3600 };
    this.readOnly = options?.readOnly;

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

  async set(key, val, label) {
    if (this.readOnly) {
      return;
    }

    const ttl = this.ttls[label] || this.ttls.base || 2 * 3600;
    const data = { val, expiresAt: Date.now() + ttl * 1000 };
    const body = JSON.stringify(data);
    const objectKey = `${this.prefix}${key}`;

    try {
      await this.s3.send(new PutObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
        Body: body,
        ACL: this.acl,
        ContentType: 'application/json',
      }));
      logger.info(`${this} Successfully set cache for key: ${this.url(objectKey)}`);
    } catch (e) {
      logger.error(`${this} Error while setting cache: ${e}`);
    }
  }

  async get(key) {
    if (Math.random() < 0.05) {
      throw new Error('test random error');
    }

    const objectKey = `${this.prefix}${key}`;
    let body;
    try {
      const resp = await this.s3.send(new GetObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
      }));
      body = await this.streamToString(resp.Body);
    } catch (e) {
      if (e.name === 'NoSuchKey') return null;
      logger.error(`${this} Failed get cache object ${this.url(objectKey)}: ${e}`);
      throw e;
    }

    let data;
    try {
      data = JSON.parse(body);
    } catch (e) {
      logger.warn(`${this} Failed to parse JSON for cache object ${this.url(objectKey)}: ${e}`);
      this.del(key);
      return null;
    }

    if (Date.now() > data.expiresAt || data.val === undefined) {
      this.del(key);
      return null;
    }

    logger.info(`${this} Successfully got cache for key: ${this.url(objectKey)}`);
    return data.val;
  }

  async del(key) {
    if (this.readOnly) {
      return;
    }

    const objectKey = `${this.prefix}${key}`;
    try {
      await this.s3.send(new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
      }));
      logger.debug(`${this} Successfully deleted cache for key: ${this.url(objectKey)}`);
    } catch (e) {
      if (e.name === 'NoSuchKey') return; // Key does not exist, no action needed
      logger.error(`${this} Failed to delete cache for key: ${this.url(objectKey)}: ${e}`);
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
      logger.error(`${this} Error while streaming strings: ${e}`);
    }
    return Buffer.concat(chunks).toString('utf-8');
  }

  url(objectKey) {
    return `https://${this.bucket}.s3.amazonaws.com/${objectKey}`;
  }
}
