import ShortUniqueId from "short-unique-id";
import { shortObjHash } from "../../src/util.js";
import { getKV } from "../../src/kv/index.js";

export const storeScores = async (scores) => {
  const kv = getKV(process.env.BENCH_KV);
  const p = [];

  for (const score of scores) {
    const hash = shortObjHash({
      name: score.name,
      commit: score.commit,
      config: score.config,
    });
    const key = `bench:${score.date}:${score.name}:${score.commit}:${hash}`;
    p.push(kv.set(key, score));
  }

  await Promise.all(p);
};
