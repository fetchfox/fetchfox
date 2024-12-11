import { logger } from '../log/logger.js';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

const s3 = new S3Client();

export const S3Cache = class {
  constructor(options) {
    this.bucket = options.bucket;
    this.prefix = options.prefix || 'fetchfox-benchmarks/';
    this.acl = options.acl;
    this.ttls = options.ttls || { base: 2 * 3600 };
    this.readOnly = options?.readOnly;
  }

  async set(key, val, label) {
    if (this.readOnly) {
      return;
    }

    const ttl = this.ttls[label] || this.ttls.base || 2 * 3600;
    const data = { val, expiresAt: Date.now() + ttl * 1000 };
    const body = JSON.stringify(data);
    const objectKey = `${this.prefix}${key}`;
    
    await s3.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: objectKey,
      Body: body,
      ACL: this.acl,
      ContentType: 'application/json',
    }));
    logger.info(`Successfully set cache for key: ${this.url(objectKey)}`);
  }

  async get(key) {
    const objectKey = `${this.prefix}${key}`;
    let resp;
    try {
      resp = await s3.send(new GetObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
      }));
    } catch (e) {
      if (e.name === 'NoSuchKey') return null;
      logger.error(`Failed get cache object ${this.url(objectKey)}: ${e}`);
      throw e;
    }

    const body = await this.streamToString(resp.Body);
    let data;
    try {
      data = JSON.parse(body);
    } catch (e) {
      logger.warn(`Failed to parse JSON for cache object ${this.url(objectKey)}: ${e}`);
      this.del(key);
      return null;
    }

    if (Date.now() > data.expiresAt || data.val === undefined) {
      this.del(key);
      return null;
    }

    logger.info(`Successfully got cache for key: ${this.url(objectKey)}`);
    return data.val;
  }

  async del(key) {
    if (this.readOnly) {
      return;
    }

    const objectKey = `${this.prefix}${key}`;
    try {
      await s3.send(new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
      }));
      logger.debug(`Successfully deleted cache for key: ${this.url(objectKey)}`);
    } catch (e) {
      if (e.name === 'NoSuchKey') return; // Key does not exist, no action needed
      logger.error(`Failed to delete cache for key: ${this.url(objectKey)}: ${e}`);
      throw e;
    }
  }

  async streamToString(stream) {
    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks).toString('utf-8');
  }

  url(objectKey) {
    return `https://${this.bucket}.s3.amazonaws.com/${objectKey}`;
  }
}
