import { logger } from '../../src/log/logger.js';
import { fox } from '../../src/index.js';

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

export const runMatrix = async (name, json, matrix, checks) => {
  const scores = [];

  const date = (new Date()).toISOString().split('T')[0];
  const timestamp = (new Date()).getTime();

  for (const config of matrix) {
    const diskCache = process.env.DISK_CACHE;
    const out = await fox
      .load(populate(json, config))
      .config({ ...config, diskCache })
      .run();

    logger.info(`Running benchmark with config ${JSON.stringify(config)}`);

    const score = [0, 0];
    for (const check of checks) {
      const s = await check(out.items);
      score[0] += s[0];
      score[1] += s[1];
    }

    scores.push({
      name,
      timestamp,
      date,
      config: { ...config },
      score,
      items: out.items,
    });
  }

  return scores;
}
