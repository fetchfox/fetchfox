export { BaseStep } from './BaseStep.js';

import { ActionStep } from './ActionStep.js';
import { ConstStep } from './ConstStep.js';
import { CrawlStep } from './CrawlStep.js';
import { ExportItemsStep } from './ExportItemsStep.js';
import { ExportURLsStep } from './ExportURLsStep.js';
import { ExtractStep } from './ExtractStep.js';
import { FetchStep } from './FetchStep.js';
import { FilterStep } from './FilterStep.js';
import { SchemaStep } from './SchemaStep.js';

export { ActionStep } from './ActionStep.js';
export { ConstStep } from './ConstStep.js';
export { CrawlStep } from './CrawlStep.js';
export { ExportItemsStep } from './ExportItemsStep.js';
export { ExportURLsStep } from './ExportURLsStep.js';
export { ExtractStep } from './ExtractStep.js';
export { FetchStep } from './FetchStep.js';
export { FilterStep } from './FilterStep.js';
export { SchemaStep } from './SchemaStep.js';

const all = [
  ActionStep,
  ConstStep,
  CrawlStep,
  ExportItemsStep,
  ExportURLsStep,
  ExtractStep,
  FetchStep,
  FilterStep,
  SchemaStep,
];
const _classMap = {};
for (const cls of all) {
  _classMap[cls.info.name] = cls;
}
export const classMap = _classMap;
export const stepNames = Object.keys(_classMap);
export const stepDescriptions = all.map(cls => cls.info);
