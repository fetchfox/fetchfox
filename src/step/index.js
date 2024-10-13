export { BaseStep } from './BaseStep.js';

import { ConstStep } from './ConstStep.js';
import { CrawlStep } from './CrawlStep.js';
import { ExportItemsStep } from './ExportItemsStep.js';
import { ExportURLsStep } from './ExportURLsStep.js';
import { ExtractStep } from './ExtractStep.js';
import { FilterStep } from './FilterStep.js';
import { LimitStep } from './LimitStep.js';

export { ConstStep } from './ConstStep.js';
export { CrawlStep } from './CrawlStep.js';
export { ExportItemsStep } from './ExportItemsStep.js';
export { ExportURLsStep } from './ExportURLsStep.js';
export { ExtractStep } from './ExtractStep.js';
export { FilterStep } from './FilterStep.js';
export { LimitStep } from './LimitStep.js';

const all = [
  ConstStep,
  CrawlStep,
  ExportItemsStep,
  ExportURLsStep,
  ExtractStep,
  FilterStep,
  LimitStep,
];
const _classMap = {};
for (const cls of all) {
  _classMap[cls.info.name] = cls;
}
export const classMap = _classMap;
export const stepNames = Object.keys(_classMap);
export const descriptions = all.map(cls => cls.info);
