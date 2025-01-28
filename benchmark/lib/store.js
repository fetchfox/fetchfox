import { logger } from '../../src/log/logger.js';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

export const storeScores = async (scores) => {
  const region = process.env.BENCH_REGION || 'us-west-2';
  const s3 = new S3Client({ region });
  const bucket = process.env.BENCH_BUCKET || 'ffcloud';
  const key = process.env.BENCH_KEY || 'benchmarks/last30days.jsonl';

  let existing = [];
  try {
    const params = {
      Bucket: bucket,
      Key: key,
    };
    const data = await s3.send(new GetObjectCommand(params));
    const body = await streamToString(data.Body);
    existing = body
      .split('\n')
      .filter((line) => !!line.trim())
      .map((line) => JSON.parse(line));
  } catch (e) {
    if (e.name == 'NoSuchKey') {
      // ignore
    } else {
      throw e;
    }
  }

  const rows = [];
  for (const score of scores) {
    const row = {
      name: score.name || 'unknown',
      date: score.date || new Date().toISOString().split('T')[0],
      branch: score.branch || 'unknown',
      commit: score.commit || 'unknown',
      score0: score.score[0] || 0,
      score1: score.score[1] || 0,

      cost_input: score.stats?.cost?.input || -1,
      cost_output: score.stats?.cost?.output || -1,
      cost_total: score.stats?.cost?.total || -1,

      tokens_input: score.stats?.tokens?.input || -1,
      tokens_output: score.stats?.tokens?.output || -1,
      tokens_total: score.stats?.tokens?.total || -1,

      runtime_msec: score.stats?.runtime?.msec || -1,

      requests_attempts: score.stats?.requests?.attempts || -1,
      requests_errors: score.stats?.requests?.errors || -1,
      requests_failures: score.stats?.requests?.failures || -1,

      // NOTE: We can store items later if needed. Leave it off
      // for now to avoid putting junk in the jsonl file.
      // items: scores.items || [],
    };

    for (const configKey of Object.keys(score.config)) {
      const val = score.config[configKey];
      let str = '';
      // Typically first entry is the name of it, eg. ai=openai:gpt-4o
      if (Array.isArray(val)) {
        str = val[0];
      } else {
        str = JSON.stringify(val);
      }
      row[`config_${configKey}`] = str;
    }
    logger.debug(`Store this benchmark data: ${JSON.stringify(row)}`);
    existing.push(row);
  }

  const updated = existing.map((item) => JSON.stringify(item)).join('\n');
  const putObjectParams = {
    Bucket: bucket,
    Key: key,
    Body: updated,
    ACL: 'public-read',
    ContentType: 'application/jsonl',
  };
  await s3.send(new PutObjectCommand(putObjectParams));
}

const streamToString = (stream) => new Promise((resolve, reject) => {
  const chunks = [];
  stream.on('data', (chunk) => chunks.push(chunk));
  stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  stream.on('error', reject);
});
