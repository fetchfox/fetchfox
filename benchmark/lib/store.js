import { getKV } from '../../src/kv/index.js';
import { hashObjectShort } from '../../src/util.js';

export const storeScores = async (scores) => {
  const kv = getKV(process.env.BENCH_KV);
  const p = [];

  for (const score of scores) {
    const hash = hashObjectShort({ name: score.name, commit: score.commit, config: score.config });

    const key = `bench:${score.date}:${score.name}:${score.commit}:${hash}`;
    p.push(kv.set(key, score));
    // console.log(key);
  }

  await Promise.all(p);
};
