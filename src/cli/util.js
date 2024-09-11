import { logger } from '../log/logger.js';
import { OpenAI } from '../ai/OpenAI.js';
import { Anthropic } from '../ai/Anthropic.js';
import { Fetcher } from '../fetch/Fetcher.js';

export const getFetcher = (name, options) => {
  let fetcherClass = {
    fetch: Fetcher
  }[name];
  if (!fetcherClass) {
    console.error(`Unknown fetcher: ${name}`);
    return;
  }
  return new fetcherClass(options);
}
