import { ConstStep } from './ConstStep.js';
import { CrawlStep } from './CrawlStep.js';
import { ExportItemsStep } from './ExportItemsStep.js';
import { ExportURLsStep } from './ExportURLsStep.js';
import { ExtractStep } from './ExtractStep.js';
import { FetchStep } from './FetchStep.js';

export { ConstStep } from './ConstStep.js';
export { CrawlStep } from './CrawlStep.js';
export { ExportItemsStep } from './ExportItemsStep.js';
export { ExportURLsStep } from './ExportURLsStep.js';
export { ExtractStep } from './ExtractStep.js';
export { FetchStep } from './FetchStep.js';

const all = [
  ConstStep,
  CrawlStep,
  ExportItemsStep,
  ExportURLsStep,
  ExtractStep,
  FetchStep,
];
const _classMap = {};
for (const cls of all) {
  _classMap[cls.info.name] = cls;
}
export const classMap = _classMap;
export const descriptions = all.map(cls => cls.info);
