import { logger } from '../log/logger.js';
import { getAi } from './util.js';

export const ask = async (prompt, options) => {
  const ai = getAi(options);

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

