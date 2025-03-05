import { logger } from '../log/logger.js';
import { srid } from '../util.js';
import { S3Helper } from '../s3/s3.js';

export const MediaExporter = class {
  constructor(options) {
    this.allowedTypes = ['application/pdf', 'image/'];
    this.s3 = new S3Helper(options);
  }

  async _getContentType(url) {
    try {
      const resp = await fetch(url, { method: 'HEAD' });

      return resp.headers.get('Content-Type');
    } catch (e) {
      logger.warn(`Error while fetching content type for ${url}: ${e}`);
    }
  }

  async export(url) {
    const mediaUrl = new URL(url);
    const contentType = await this._getContentType(mediaUrl);

    if (this.allowedTypes.some(type => contentType.startsWith(type))) {
      console.log('Allowed');
    } else {
      logger.error(`${contentType} is not supported.`);
    }

    const fileName = mediaUrl.pathname.split('/').pop();

    const s3Url = await this.generalMediaExporter(mediaUrl, fileName, contentType);

    logger.info(`Exported ${fileName}: ${s3Url}`);

    return s3Url;
  }

  async generalMediaExporter(url, fileName, contentType) {
    const resp = await fetch(url);

    if (!resp.ok) {
      logger.error(`GET request failed for export ${url}: ${resp.statusText}`);
      return '';
    }

    const buffer = await resp.arrayBuffer();

    const id = srid();
    const objectKey = `export/media/${id}/${fileName}`;

    return this.s3.put(objectKey, buffer, contentType);
  }
};