import fs from 'node:fs';

import { logger } from '../log/logger.js';

export const saveItems = (filename, items) => {
  logger.info(`Save ${items.length} items to ${filename}`);
  return fs.writeFileSync(
    filename,
    JSON.stringify(items, null, 2));
}
