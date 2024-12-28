export const Item = class {
  constructor(data, source) {
    for (const k of Object.keys(data)) {
      this[k] = this.clean(data[k]);
    }

    if (!this._sourceUrl) {
      this._sourceUrl = source?.url || data?._sourceUrl;
      if (source?.html?.length) {
        this._sourceSize = source.html.length;
      }
    }

    if (source?.htmlUrl) this._htmlUrl = source.htmlUrl;
    if (source?.screenshotUrl) this._screenshotUrl = source.screenshotUrl;
  }

  toString() {
    return `[Item: ${JSON.stringify(this).substr(0, 40)}...]`;
  }

  copy() {
    return new Item(JSON.parse(JSON.stringify(this)));
  }

  publicOnly() {
    const copy = { ...this };
    for (const key of Object.keys(this)) {
      if (key.startsWith('_')) {
        delete copy[key];
      }
    }
    return copy;
  }

  async finish() {
  }

  clean(val) {
    val = '' + val;
    val = val.trim();
    if (/^[0-9,]+$/.test(val)) {
      val = val.replace(/,/g, '');
    }
    if (val == 'not found') {
      val = '(not found)';
    }
    return val;
  }
}
