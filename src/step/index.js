export { BaseStep } from './BaseStep.js';

import { ActionStep } from './ActionStep.js';
import { ConstStep } from './ConstStep.js';
import { CrawlStep } from './CrawlStep.js';
import { ExportItemsStep } from './ExportItemsStep.js';
import { ExportURLsStep } from './ExportURLsStep.js';
import { ExtractStep } from './ExtractStep.js';
import { FetchStep } from './FetchStep.js';
import { FilterStep } from './FilterStep.js';
import { LimitStep } from './LimitStep.js';
import { SchemaStep } from './SchemaStep.js';
import { UniqueStep } from './UniqueStep.js';

export { ActionStep } from './ActionStep.js';
export { ConstStep } from './ConstStep.js';
export { CrawlStep } from './CrawlStep.js';
export { ExportItemsStep } from './ExportItemsStep.js';
export { ExportURLsStep } from './ExportURLsStep.js';
export { ExtractStep } from './ExtractStep.js';
export { FetchStep } from './FetchStep.js';
export { FilterStep } from './FilterStep.js';
export { LimitStep } from './LimitStep.js';
export { SchemaStep } from './SchemaStep.js';
export { UniqueStep } from './UniqueStep.js';

export const classMap = {
  action: ActionStep,
  'const': ConstStep,
  crawl: CrawlStep,
  exportItems: ExportItemsStep,
  exportURLs: ExportURLsStep,
  extract: ExtractStep,
  fetch: FetchStep,
  filter: FilterStep,
  limit: LimitStep,
  schema: SchemaStep,
  unique: UniqueStep,
};

export { stepNames, stepDescriptions } from './info.js';
