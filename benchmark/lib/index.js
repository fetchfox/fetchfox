import { logger } from '../../src/log/logger.js';
import { fox } from '../../src/index.js';
import { storeScores } from './store.js';

const populate = (json, config) => {
  let str = JSON.stringify(json);
  for (const key of Object.keys(config)) {
    str = str.replaceAll(`{{${key}}}`, config[key]);
  }
  return JSON.parse(str);
}

export const itRunMatrix = async (it, name, json, matrix, checks, options) => {
  for (const config of matrix) {
    const testName = `${name} { ${Object.keys(config).map(k => k + '=' + config[k]).join('; ')} } @bench`;

    it(testName, async function () {
      console.log(testName);

      this.timeout(3 * 60 * 1000); // 3 minutes

      const scores = await runMatrix(
        name,
        json,
        [config],
        checks,
        options);

      if (options.shouldSave) {
        await storeScores(scores);
      }
    });
  }
}

export const runMatrix = async (name, json, matrix, checks, options) => {
  const scores = [];

  const date = (new Date()).toISOString().split('T')[0];
  const timestamp = (new Date()).getTime();
  const commit = process.env.COMMIT || 'local';
  const branch = process.env.BRANCH || 'local';

  let i = 0;

  for (const config of matrix) {
    const diskCache = process.env.DISK_CACHE;
    const fullConfig = { ...config, diskCache };

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
      branch,
      commit,
      config: { ...config },
      score,
      items: out.items,
    };

    const copy = { ...s };
    delete copy.items;
    console.log(JSON.stringify(copy, null, 2));

    scores.push(s);

    if (options?.shouldSave) {
      await storeScores([s]);
    }
  }

  return scores;
}
