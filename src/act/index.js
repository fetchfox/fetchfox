import { logger } from '../log/logger.js';
import { Actor } from './Actor.js';

// export const DefaultActor = Actor;

export const getActor = (which, options) => {
  return new Actor();
}
