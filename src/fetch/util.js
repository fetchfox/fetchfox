import { logger } from '../log/logger.js';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export const presignS3 = async ({ bucket, key, contentType, acl, region }) => {
  logger.debug(`Generating presigned URL: ${bucket}, ${key}, ${contentType}, ${acl}, ${region}`);
  const s3 = new S3Client({ region });
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

export const putS3 = async (key, val, { bucket, contentType, acl, region }) => {
  logger.debug(`Putting to S3: ${bucket}, ${key}, ${contentType}, ${acl}, ${region}`);
  const s3 = new S3Client({ region });
  const params = {
    Bucket: bucket,
    Key: key,
    Body: val,
    ContentType: contentType,
    ACL: acl,
  };
  const resp = await s3.send(new PutObjectCommand(params));
  const url = `https://${bucket}.s3.amazonaws.com/${key}`;
  return url;
};

export const urlForKey = (key, { bucket }) => (
  `https://${bucket}.s3.amazonaws.com/${key}`
);
