import {
  getAI,
  getCrawler,
  getFetcher,
  getExtractor,
  getExporter,
} from '../index.js';

export const Cursor = class {
  constructor(ctx) {
    const cache = ctx?.cache;
    if (!ctx?.ai) ctx.ai = getAI(null, { cache });
    if (!ctx?.crawler) ctx.crawler = getCrawler(null, { cache });
    if (!ctx?.fetcher) ctx.fetcher = getFetcher(null, { cache });
    if (!ctx?.extractor) ctx.extractor = getExtractor(null, { cache });
    if (!ctx?.exporter) ctx.exporter = getExporter(null, { cache });
    this.ctx = ctx;
  }
}
