import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Dropbox } from 'dropbox';
import fetch from 'node-fetch';

const s3 = new S3Client();
const dbx = new Dropbox({ accessToken: process.env.DROPBOX_ACCESS_TOKEN, fetch });

export const publishToS3 = async (buf, contentType, acl, bucket, key) => {
  const params = {
    Bucket: bucket,
    Key: key,
    Body: buf,
    ContentType: contentType,
    ACL: acl,
  };

  const command = new PutObjectCommand(params);
  const resp = await s3.send(command);
  const location = `https://${bucket}.s3.${s3.config.region}.amazonaws.com/${key}`;
  return location;
}
