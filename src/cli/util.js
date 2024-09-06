import { logger } from '../log/logger.js';
import { OpenAI } from '../ai/OpenAI.js';
import { Anthropic } from '../ai/Anthropic.js';
import { Fetcher } from '../fetch/Fetcher.js';

export const getFetcher = (name) => {
  let fetcherClass = {
    fetch: Fetcher
  }[name];
  if (!fetcherClass) {
    console.error(`Unknown fetcher: ${name}`);
    return;
  }
  return new fetcherClass();
}

export const getAi = ({ provider, model, apiKey }) => {
  let aiClass = {
    openai: OpenAI,
    anthropic: Anthropic,
  }[provider];
  if (!aiClass) {
    console.error(`Unknown AI provider: ${provider}`);
    return;
  }
  return new aiClass(apiKey, model);
}
