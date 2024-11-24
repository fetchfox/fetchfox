import { logger } from '../../src/log/logger.js';
import { fox } from '../../src/index.js';
import { storeScores } from './store.js';

export const createMatrix = (configs) => {
  let matrix = [{}];

  for (const key of Object.keys(configs)) {
    const newMatrix = [];
    for (const val of configs[key]) {
      for (const existing of matrix) {
        const updated = { ...existing };
        updated[key] = val;
        newMatrix.push(updated);
      }
    }
    matrix = newMatrix;
  }

  return matrix;
}

const populate = (json, config) => {
  let str = JSON.stringify(json);
  for (const key of Object.keys(config)) {
    str = str.replaceAll(`{{${key}}}`, config[key]);
  }
  return JSON.parse(str);
}

export const runMatrix = async (name, json, matrix, checks, options) => {
  const scores = [];

  const date = (new Date()).toISOString().split('T')[0];
  const timestamp = (new Date()).getTime();
  const commit = process.env.COMMIT_HASH || 'dev';

  let i = 0;

  for (const config of matrix) {
    const diskCache = process.env.DISK_CACHE;

    const fullConfig = { ...config, diskCache };
    if (!fullConfig.fetcher) {
      fullConfig.fetcher = [
        'fetch',
        { s3: { bucket: 'ffcloud', acl: 'public-read' } }
      ];
    } else if (typeof fullConfig.fetcher == 'string') {
      fullConfig.fetcher = [
        fullConfig.fetcher,
        { s3: { bucket: 'ffcloud', acl: 'public-read' } }
      ];
    }

    const out = await fox
      .load(populate(json, config))
      .config(fullConfig)
      .run();

    logger.info(``);
    logger.info(`  Running benchmark ${++i}/${matrix.length} with config ${JSON.stringify(config)}`);
    logger.info(``);

    const score = [0, 0];
    for (const check of checks) {
      const s = await check(out.items);
      score[0] += s[0];
      score[1] += s[1];
    }

    const s = {
      name,
      timestamp,
      date,
      commit,
      config: { ...config },
      score,
      items: out.items,
    };
    scores.push(s);

    if (options?.shouldSave) {
      await storeScores([s]);
    }
  }

  return scores;
}
