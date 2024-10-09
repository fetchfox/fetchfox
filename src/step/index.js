export { ConstStep } from './ConstStep.js';
export { CrawlStep } from './CrawlStep.js';
export { ExportStep } from './ExportStep.js';
export { ExtractStep } from './ExtractStep.js';
export { FetchStep } from './FetchStep.js';

import { ConstStep } from './ConstStep.js';
import { CrawlStep } from './CrawlStep.js';
import { ExportStep } from './ExportStep.js';
import { ExtractStep } from './ExtractStep.js';
import { FetchStep } from './FetchStep.js';

const all = [
  ConstStep,
  CrawlStep,
  ExportStep,
  ExtractStep,
  FetchStep,
];
const _classMap = {};
for (const cls of all) {
  _classMap[cls.info.name] = cls;
}

console.log('classMap', _classMap);

export const classMap = _classMap;
export const descriptions = all.map(cls => cls.info);

console.log('descriptions', descriptions);
