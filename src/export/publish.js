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
  const [ , region] = await Promise.all([
    s3.send(command),
    s3.config.region(),
  ]);
  const location = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
  return location;
}

export const publishToDropbox = async (buf, path, token) => {
  const dbx = new Dropbox({ accessToken: token, fetch });

  let resp;
  resp = await dbx.filesUpload({
    path: path,
    contents: buf,
    mode: 'overwrite',
    autorename: true,
  });

  const existing = await dbx.sharingListSharedLinks({
    path: resp.result.path_display,
    direct_only: true,
  });

  let url;
  if ((existing?.result?.links || []).length) {
    url = existing.result.links[0].url;
  } else {
    url = (await dbx.sharingCreateSharedLinkWithSettings({
      path: resp.result.path_display,
    })).result.url;
  }
  return url;
}
