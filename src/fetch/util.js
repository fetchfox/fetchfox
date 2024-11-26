import { logger } from '../log/logger.js';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export const presignS3 = async ({ bucket, key, contentType, acl }) => {
  logger.debug(`Generating presigned URL 2`);
  const s3 = new S3Client();
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
    ACL: acl,
  });
  const url = await getSignedUrl(
    s3,
    command,
    { expiresIn: 30 * 60 });
  logger.debug(`Generating presigned URL ${url}`);
  return url;
}
