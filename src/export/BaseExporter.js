export const BaseExporter = class {
  constructor(options) {
    this.format = options?.format || 'jsonl';

    // TODO: options for:
    // - append vs. truncate
    // - combine vs. single item out
  }
}
