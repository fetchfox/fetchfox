import { logger } from '../log/logger.js';
import { Actor } from './Actor.js';

export { BaseActor } from './BaseActor.js';

export const getActor = (unused, options) => {
  return new Actor(options);
}
