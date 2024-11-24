import CryptoJS from 'crypto-js';
import ShortUniqueId from 'short-unique-id';
import { getKV } from '../../src/kv/index.js';

export const storeScores = async (scores) => {
  const kv = getKV(process.env.BENCH_KV);
  const p = [];

  for (const score of scores) {
    const hash = CryptoJS
      .SHA256(JSON.stringify({ name: score.name, commit: score.commit, config: score.config }))
      .toString(CryptoJS.enc.Hex)
      .substr(0, 16);

    const key = `bench:${score.date}:${score.name}:${score.commit}:${hash}`;
    p.push(kv.set(key, score));
    console.log(key);
  }

  await Promise.all(p);
}
