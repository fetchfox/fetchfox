export const BaseTask = class {
  toString() {
    return `[${this.constructor.name}]`;
  }

  async expected(urls, limit) {
    let results = '';
    for (const url of urls) {
      results += `Expected results for ${url}, limited to first ${limit}:\n`;

      const gen = this._expected(url);
      for await (const r of gen) {
        results += '\t' + JSON.stringify(r) + '\n'
        if (group.length >= limit) {
          break;
        }
      }
    }
    return results;
  }
}
