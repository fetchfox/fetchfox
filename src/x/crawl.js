import { getFetcher } from '../src/index.js';

export const crawl = async ({ url, prompt, ...rest }) => {
  const fetcher = rest?.fetcher || getFetcher();
  const ai = rest?.ai || getAI();

  console.log('crawl');

  const q = [url];
  const seen = {};

  while (q.length > 0) {
    const u = q.pop();
    if (seen[u]) {
      continue;
    }
    seen[u] = true;

    const urls = await findUrls({ url: u, fetcher, ai });
  }

  // stages:
  // - ranker
  // - categorizer
  // - emitter
}

const findUrls = async ({ url, fetcher, ai }) => {
  const doc = await fetcher.first(url);
}
