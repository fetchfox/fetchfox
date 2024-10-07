import { logger } from '../log/logger.js';
import { getAI } from '../ai/index.js';

export const ask = async (prompt, options) => {
  const ai = getAI(options.ai);

  if (options.stream) {
    for await (const result of ai.stream(prompt)) {
      console.log(result);
    }
  } else {
    const answer = await ai.ask(prompt);
    console.log(answer);
  }
}
