import { logger } from '../log/logger.js';
import { getAi } from '../ai/index.js';

export const ask = async (prompt, options) => {
  const ai = getAi(options.ai);

  let rate = 100;
  let prev = 0;

  for await (const result of ai.stream(prompt)) {
    console.log(result);
  }

  // const { answer } = await ai.ask(
  //   prompt,
  //   ({ answer }) => {
  //     if (answer.length > prev + rate) {
  //       logger.info(`Partial response: ${answer.slice(prev)}`);
  //       prev = answer.length;
  //     }
  //   });

  console.log(answer);
}

