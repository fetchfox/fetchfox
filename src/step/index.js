export { BaseStep } from "./BaseStep.js";

import { ConstStep } from "./ConstStep.js";
import { CrawlStep } from "./CrawlStep.js";
import { ExtractStep } from "./ExtractStep.js";
import { FetchStep } from "./FetchStep.js";
import { FilterStep } from "./FilterStep.js";
import { LimitStep } from "./LimitStep.js";
import { SchemaStep } from "./SchemaStep.js";
import { UniqueStep } from "./UniqueStep.js";

export { ConstStep } from "./ConstStep.js";
export { CrawlStep } from "./CrawlStep.js";
export { ExtractStep } from "./ExtractStep.js";
export { FetchStep } from "./FetchStep.js";
export { FilterStep } from "./FilterStep.js";
export { LimitStep } from "./LimitStep.js";
export { SchemaStep } from "./SchemaStep.js";
export { UniqueStep } from "./UniqueStep.js";

export const classMap = {
  const: ConstStep,
  crawl: CrawlStep,
  extract: ExtractStep,
  fetch: FetchStep,
  filter: FilterStep,
  limit: LimitStep,
  schema: SchemaStep,
  unique: UniqueStep,
};

export { stepNames, stepDescriptions } from "./info.js";
