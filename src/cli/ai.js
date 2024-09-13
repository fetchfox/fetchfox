import { logger } from '../log/logger.js';
import { getAi } from '../ai/index.js';

export const ask = async (prompt, options) => {
  const ai = getAi(options.ai);

  if (options.stream) {
    for await (const result of ai.stream(prompt)) {
      console.log(result);
    }
  } else {
    const answer = await ai.ask(prompt);
    console.log(answer);
  }
}
