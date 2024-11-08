import { logger } from '../log/logger.js';
import { Actor } from './Actor.js';

export { BaseActor } from './BaseActor.js';

// export const DefaultActor = Actor;

export const getActor = (unused, options) => {
  console.log('getActor', unused, options);
  logger.trace('x');
  return new Actor(options);
}
