import { OpenAI } from './OpenAI.js';
import { Anthropic } from './Anthropic.js';

export const getAi = (which, options) => {
  const { apiKey, cache } = options || {};
  if (typeof which != 'string') {
    return which;
  }

  const [provider, model] = which.split(':');
  let aiClass = {
    openai: OpenAI,
    anthropic: Anthropic,
  }[provider];
  if (!aiClass) {
    console.error(`Unknown AI provider: ${provider}`);
    return;
  }
  return new aiClass(model, { apiKey, cache });
}
