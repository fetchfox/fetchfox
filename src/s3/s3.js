import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { logger } from '../log/logger.js';

export const S3Helper = class {
  constructor(options) {
    this.bucket = options?.bucket || 'ffcloud';
    this.region = options?.region || 'us-west-2';
    this.acl = options?.acl || 'public-read';
    this.s3 = new S3Client({ region: this.region });
  }

  _getUrl = (key) => {
    return `https://${this.bucket}.s3.amazonaws.com/${key}`;
  };

  async put(key, val, contentType) {
    const params = {
      Bucket: this.bucket,
      Key: key,
      Body: val,
      ContentType: contentType,
      ACL: this.acl,
    };

    try {
      await this.s3.send(new PutObjectCommand(params));
      const s3Url = this._getUrl(key);
      logger.info('S3 URL:', s3Url);

      return s3Url;
    } catch (e) {
      logger.error('S3 put error:', e);
      return '';
    }
  }
};