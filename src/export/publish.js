import AWS from 'aws-sdk';
import { Dropbox } from 'dropbox';
import fetch from 'node-fetch';

const s3 = new AWS.S3();
const dbx = new Dropbox({ accessToken: process.env.DROPBOX_ACCESS_TOKEN, fetch });

export const publishToS3 = async (buf, contentType, acl, bucket, key) => {
  const params = {
    Bucket: bucket,
    Key: key,
    Body: buf,
    ContentType: contentType,
    ACL: acl,
  };
  const resp = await s3.upload(params).promise();
  return resp.Location;
}
