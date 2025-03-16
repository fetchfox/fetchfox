export const BaseCache = class {
  constructor(options) {
    this.cacheSpace = options?.cacheSpace || '';
  }

  wrapKey(key) {
    return `${this.cacheSpace ? this.cacheSpace + '::' : ''}${key}`;
  }
}
