export const KnowledgeBase = class {
  constructor(kv) {
    this.kv = kv;
    this.byUrl = {};
  }

  _init(url) {
  }

  async update(url, type, fact) {
    console.log('KB got ->', url, type, fact);

    this.byUrl[url] ||= {
      items: [],
      links: [],
    };
    this.byUrl[url][type].push(fact);
  }
}
