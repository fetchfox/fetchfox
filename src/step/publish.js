import AWS from 'aws-sdk';
import { Dropbox } from 'dropbox';
import fetch from 'node-fetch';

const s3 = new AWS.S3();
const dbx = new Dropbox({ accessToken: process.env.DROPBOX_ACCESS_TOKEN, fetch });

export const publishToS3 = async (buf, key) => {
  const params = {
    Bucket: 'ffcloud',
    Key: key,
    Body: buf,
    ContentType: 'application/pdf',
    ACL: 'public-read',
  };
  const resp = await s3.upload(params).promise();
  return resp.Location;
}

export const publishToDropbox = async (buf, path) => {
  const resp = await dbx.filesUpload({
    path: path,
    contents: buf,
    mode: 'overwrite',
    autorename: true,
  });

  const existing = await dbx.sharingListSharedLinks({
    path: resp.result.path_display,
    direct_only: true,
  });

  console.log('existing', existing);
  console.log('existing', existing?.result?.links);
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
