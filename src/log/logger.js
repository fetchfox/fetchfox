import log from 'loglevel';

const LOG_LEVEL = process.env.FETCHFOX_LOG_LEVEL || process.env.FF_LOG || 'warn';
log.setLevel(LOG_LEVEL);

export const logger = {
  debug: (...args) => {
    if (log.getLevel() <= log.levels.DEBUG) {
      log.debug(...args);
    }
  },
  info: (...args) => {
    log.info(...args);
  },
  warn: (...args) => {
    log.warn(...args);
  },
  error: (...args) => {
    log.error(...args);
  },
};
