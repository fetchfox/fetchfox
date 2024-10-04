import { logger } from '../log/logger.js';
import { OpenAI } from './OpenAI.js';
import { Anthropic } from './Anthropic.js';
import { Ollama } from './Ollama.js';
import { Mistral } from './Mistral.js';
import { Groq } from './Groq.js';
import { Gemini } from './Gemini.js';

export const DefaultAI = OpenAI;

export const getAI = (which, options) => {
  if (!which) return new DefaultAI(null, options);
  if (typeof which != 'string') return which;

  let [provider, model, extra] = which.split(':');
  if (extra) model += ':' + extra;
  let aiClass = {
    openai: OpenAI,
    anthropic: Anthropic,
    ollama: Ollama,
    mistral: Mistral,
    groq: Groq,

    gemini: Gemini,
    google: Gemini,

  }[provider];
  if (!aiClass) {
    logger.error(`Unknown AI provider: ${provider}`);
    return;
  }
  return new aiClass(model, options);
}
