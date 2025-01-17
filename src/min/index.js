import { logger } from "../log/logger.js";
import { TagRemovingMinimizer } from "./TagRemovingMinimizer.js";

export const DefaultMinimizer = TagRemovingMinimizer;

export const getMinimizer = (which, options) => {
  if (!which) return new DefaultMinimizer(options);
  if (typeof which != "string") return which;

  let minimizerClass = {
    tr: TagRemovingMinimizer,
    "tag-removing": TagRemovingMinimizer,
  }[which];
  if (!minimizerClass) {
    logger.error(`Unknown minimizer type: ${which}`);
    return;
  }
  return new minimizerClass(options);
};
