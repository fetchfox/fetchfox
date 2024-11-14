import { fox } from '../../src/index.js';

export const runCrawlBenchmark = async (plan, crawl, analyze, configs) => {

  const results = await Promise.all(configs.map(async function(config) {
    const failure = {
      failure: true,
      config: config,
    }

    let res = {};
    let planDuration = 0.0;
    let crawlDuration = 0.0;
    try {
      const planStartTime = performance.now();
      const wf = await plan(config);
      planDuration = performance.now() - planStartTime;
      console.log('wf', JSON.stringify(wf.dump(), null, 2));

      const crawlStartTime = performance.now();
      const preds = await crawl(wf, config);
      crawlDuration = performance.now() - crawlStartTime;

      res = await analyze(preds, config);
    } catch (err) {
      console.log(err);
      return failure;
    }
    
    return {
      ...res,
      failure: false,
      planDuration: planDuration,
      crawlDuration: crawlDuration,
      config: config,
    }
  }));

  return results;
}


/**
 * @typedef {Object} EvalPatterns
 * @property {(RegExp|RegExp[]|null)} includePatterns - Pattern(s) that must match
 * @property {(RegExp|RegExp[]|null)} excludePatterns - Pattern(s) that must not match
 */

/**
 * Checks if a value matches patterns defined in an evaluation patterns object
 * @param {string} value - The value to test
 * @param {EvalPatterns} evalPatterns - Object containing include and exclude patterns
 * @returns {boolean} True if value matches include pattern(s) and doesn't match exclude pattern(s)
 */
export const matchesPatterns = (value, evalPatterns = {}) => {
  const { includePatterns = null, excludePatterns = null } = evalPatterns;

  // Convert single patterns to arrays for consistent handling
  const includes = Array.isArray(includePatterns) ? includePatterns : [includePatterns];
  const excludes = Array.isArray(excludePatterns) ? excludePatterns : [excludePatterns];

  // If no include patterns, treat as "include all"
  if (!includePatterns) {
    return !excludes.some(pattern => pattern?.test(value));
  }

  // Check if ANY include pattern matches (OR logic)
  const hasIncludeMatch = includes.some(pattern => pattern?.test(value));
  
  // Check if ANY exclude pattern matches (OR logic)
  const hasExcludeMatch = excludes.some(pattern => pattern?.test(value));

  // Must match an include pattern AND not match any exclude patterns
  return hasIncludeMatch && !hasExcludeMatch;
}

