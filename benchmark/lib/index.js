import { logger } from '../../src/log/logger.js';
import { fox } from '../../src/index.js';
import { S3Cache } from '../../src/cache/S3Cache.js';
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
    const testName = `${name} { ${Object.keys(config).map(k => k + '=' + JSON.stringify(config[k])).join('; ')} } @bench`;

    it(testName, async function () {
      console.log(testName);

      try {
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
      } catch (e) {
        logger.error(`Benchmark ${testName} had an error: ${e} ${e.stack}`);
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
    const fullConfig = { ...config };

    if (process.env.S3_CACHE_BUCKET) {
      const params = {
        bucket: process.env.S3_CACHE_BUCKET,
        prefix: 'benchmarks/',
        acl: 'public-read',
        ttls: { base: 10 * 365 * 24 * 3600 },
      };
      const cache = new S3Cache(params);

      // Only cache in fetcher
      if (typeof fullConfig.fetcher == 'string') {
        fullConfig.fetcher = [
          fullConfig.fetcher,
          { cache }
        ];
      } else if (Array.isArray(fullConfig.fetcher)) {
        fullConfig.fetcher[1].cache = cache;
      } else {
        throw 'Unhandled: TODO';
      }
    }

    if (options.noCache && fullConfig.cache) {
      delete fullConfig.cache;
    }


    const wf = await fox
      .load(populate(json, config))
      .config(fullConfig);

    const before = JSON.parse(JSON.stringify(wf.ctx.ai.stats));

    const out = await wf.run();

    const after = JSON.parse(JSON.stringify(wf.ctx.ai.stats));
    const diff = diffStats(before, after);

    console.log('AI stats:');
    console.log(JSON.stringify(diff, null, 2));

    logger.info(``);
    logger.info(`  Running benchmark ${++i}/${matrix.length} with config ${JSON.stringify(config)}`);
    logger.info(``);

    const score = [0, 0];
    for (const check of checks) {
      const s = await check(out.items);
      if (!s) continue;
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
      stats: diff,
      score,
      items: out.items,
    };

    const copy = { ...s };
    delete copy.items;
    console.log(JSON.stringify(copy, null, 2));

    scores.push(s);
  }

  return scores;
}

const diffStats = (left, right) => {
  const diff = {};
  for (const key of Object.keys(left)) {
    diff[key] = diffObjects(left[key] || {}, right[key] || {});
  }
  return diff;
}

const diffObjects = (l, r) => {
  const diff = {};
  for (const key of Object.keys(l)) {
    const valL = l[key] || 0;
    const valR = r[key] || 0;
    diff[key] = valR - valL;
  }
  return diff;
}
