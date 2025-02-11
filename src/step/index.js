export { BaseStep } from './BaseStep.js';

import { ConstStep } from './ConstStep.js';
import { CrawlStep } from './CrawlStep.js';
import { ExtractStep } from './ExtractStep.js';
import { ActionStep } from './ActionStep.js';
import { FetchStep } from './FetchStep.js';
import { FilterStep } from './FilterStep.js';
import { LimitStep } from './LimitStep.js';
import { UniqueStep } from './UniqueStep.js';

export { ConstStep } from './ConstStep.js';
export { CrawlStep } from './CrawlStep.js';
export { ExtractStep } from './ExtractStep.js';
export { ActionStep } from './ActionStep.js';
export { FetchStep } from './FetchStep.js';
export { FilterStep } from './FilterStep.js';
export { LimitStep } from './LimitStep.js';
export { UniqueStep } from './UniqueStep.js';

export const classMap = {
  const: ConstStep,
  crawl: CrawlStep,
  extract: ExtractStep,
  action: ActionStep,
  fetch: FetchStep,
  filter: FilterStep,
  limit: LimitStep,
  unique: UniqueStep,
};

export { stepNames, stepDescriptions } from './info.js';
