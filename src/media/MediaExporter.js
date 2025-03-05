import { logger } from '../log/logger.js';
import mime from 'mime-types';
import path from 'path';
import { srid } from '../util.js';
import { S3Helper } from '../s3/s3.js';

export const MediaExporter = class {
  constructor (options) {
    this.allowedTypes = ['application/pdf', 'image/*'];
    this.s3 = new S3Helper(options);
  }

  async _getContentType (url) {
    try {
      const resp = await fetch(url, { method: 'HEAD' });

      return resp.headers.get('Content-Type');
    } catch (e) {
      logger.warn(`Error while fetching content type for ${url}: ${e}`);
    }
  }

  async generalMediaExporter (url) {
    const contentType = await this._getContentType(url);
    const resp = await fetch(url);

    if (!resp.ok) logger.error(
      `GET request failed for export ${url}: ${resp.statusText}`);

    const buffer = await resp.arrayBuffer();
    const extension = mime.extension(contentType) || 'bin';
    const cleanUrl = path.basename(url).split('?')[0];
    const fileName = cleanUrl.includes('.')
      ? cleanUrl
      : `${cleanUrl}.${extension}`;

    const id = srid();
    const objectKey = `export/media/${id}/${fileName}`;

    return this.s3.put(objectKey, buffer, contentType);
  }
};