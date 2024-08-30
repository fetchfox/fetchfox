import fetch from 'node-fetch';
import { Document } from '../document/Document.js';

export const FetchCrawler = class {
  constructor() { }

  async fetch(req) {
    const resp = await fetch(req);
    const doc = new Document();
    await doc.load(resp);
    return doc;
  }
}
