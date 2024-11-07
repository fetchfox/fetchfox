import fs from 'fs';
import { logger } from '../log/logger.js';
import { BaseVision } from './BaseVision.js';

export const Vision = class extends BaseVision {
  constructor(args) {
    super(args);
  }

  async ask(image, prompt, options) {
    let buf;

    if (typeof image === 'string') {
      logger.debug(`Loading image file ${image}`);
      buf = fs.readFileSync(image);
    } else if (Buffer.isBuffer(image)) {
      logger.debug(`Using image buffer`);
      buf = image;
    } else {
      throw new Error('Invalid image input. Must be a path or a Buffer.');
    }

    logger.debug(`Vision making image query to AI ${this.ai}`);

    const base64 = buf.toString('base64');
    const imageUrl = `data:image/jpeg;base64,${base64}`;
    const answer = await this.ai.ask(prompt, { ...options, imageUrl });

    logger.info(`Got vision response: ${JSON.stringify(answer.partial).substr(0, 120)}`);

    return answer;
  }
}
