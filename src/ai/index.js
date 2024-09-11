import { OpenAI } from './OpenAI.js';
import { Anthropic } from './Anthropic.js';

export const getAi = (which, { apiKey, cache }) => {
  if (typeof which != 'string' && which.stream && which.model) {
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
