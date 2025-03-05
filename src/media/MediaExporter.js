import { logger } from '../log/logger.js';
import { srid } from '../util.js';
import { S3Helper } from '../s3/s3.js';
import ytdl from '@distube/ytdl-core';

export const MediaExporter = class {
  constructor(options) {
    this.allowedTypes = ['application/pdf', 'image/'];
    this.videoTypes = ['youtube'];
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

    const supportedType = this.allowedTypes.some(type => contentType.startsWith(type));
    const supportedVideo = this.videoTypes.some(type => mediaUrl.hostname.includes(type));

    if (!(supportedType || supportedVideo)) {
      logger.error(`${contentType} is not supported.`);
      return '';
    }

    let s3Url;
    const fileName = mediaUrl.pathname.split('/').pop();

    if (supportedType) s3Url = await this.generalMediaExporter(mediaUrl, fileName, contentType);
    if (supportedVideo) s3Url = await this.youtubeExporter(mediaUrl, fileName);

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
    const key = `export/media/${id}/${fileName}`;

    return this.s3.put(key, buffer, contentType);
  }

  async youtubeExporter(url, fileName) {
    const stream = ytdl(url.href, { quality: 'highestvideo' });

    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);

    const id = srid();
    const key = `export/youtube/${id}/${fileName}.mp4`;

    return this.s3.put(key, buffer, 'video/mp4');
  }
};