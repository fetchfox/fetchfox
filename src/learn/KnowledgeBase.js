import AsyncLock from 'async-lock';

export const KnowledgeBase = class {
  constructor(kv) {
    this.kv = kv;
    this.lock = new AsyncLock();
  }

  async dump() {
    const urls = {};
    const keys = await this.kv.keys();
    const facts = await Promise.all(keys.map(key => this.get(key)));
    for (let i = 0; i < keys.length; i++) {
      urls[keys[i]] = facts[i];
    }
    return { urls }
  }

  async get(url) {
    return this.kv.get(url);
  }

  async update(url, type, fact) {
    return this.lock.acquire(url, async (done) => {
      try {
        console.log('KB got ->', url, type, fact);
        const facts = await this.get(url) || {
          items: [],
          links: [],
        };
        facts[type].push(fact);
        return this.kv.set(url, facts);

      } finally {
        done();
      }
    });
  }
}
