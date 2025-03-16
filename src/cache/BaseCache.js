export const BaseCache = class {
  constructor(options) {
    this.cacheSpace = options?.cacheSpace || '';
  }

  wrapKey(key) {
    console.log('wrap key', key, this.cacheSpace);
    return `${this.cacheSpace ? this.cacheSpace + '::' : ''}${key}`;
  }
}
