import { logger } from '../log/logger.js';
import { OpenAI } from '../ai/OpenAI.js';
import { Anthropic } from '../ai/Anthropic.js';

export const ask = async (prompt, { provider, model, apiKey }) => {
  let aiClass = {
    openai: OpenAI,
    anthropic: Anthropic,
  }[provider];
  if (!aiClass) {
    console.error(`Unknown AI provider: ${provider}`);
    return;
  }
  const ai = new aiClass(apiKey, model);

  let rate = 100;
  let prev = 0;
  const { answer } = await ai.ask(
    prompt,
    ({ answer }) => {
      if (answer.length > prev + rate) {
        logger.info(`Partial response: ${answer.slice(prev)}`);
        prev = answer.length;
      }
    });

  console.log(answer);
}

