import { logger } from '../log/logger.js';
import { OpenAI } from './OpenAI.js';
import { Anthropic } from './Anthropic.js';
import { Ollama } from './Ollama.js';
import { Mistral } from './Mistral.js';
import { Groq } from './Groq.js';
import { Gemini } from './Gemini.js';
export { BaseAI } from './BaseAI.js';

export const DefaultAI = OpenAI;

export const getAI = (which, options) => {
  which = which || options?.model;
  if (!which) return new DefaultAI(options);
  if (typeof which != 'string') return which;

  let parts = which.split(':');
  const provider = parts[0];
  const model = parts.slice(1).join(':');
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
  return new aiClass(options);
}
