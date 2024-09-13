import { OpenAI } from './OpenAI.js';
import { Anthropic } from './Anthropic.js';
import { Ollama } from './Ollama.js';

export const getAi = (which, options) => {
  const { apiKey, cache } = options || {};
  if (typeof which != 'string') {
    return which;
  }

  let [provider, model, extra] = which.split(':');
  if (extra) model += ':' + extra;
  let aiClass = {
    openai: OpenAI,
    anthropic: Anthropic,
    ollama: Ollama,
  }[provider];
  if (!aiClass) {
    console.error(`Unknown AI provider: ${provider}`);
    return;
  }
  return new aiClass(model, { apiKey, cache });
}
