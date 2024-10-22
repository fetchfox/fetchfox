import log from 'loglevel';
import chalk from 'chalk';
import prefix from 'loglevel-plugin-prefix';

const colors = {
  TRACE: chalk.magenta,
  DEBUG: chalk.cyan,
  INFO: chalk.blue,
  WARN: chalk.yellow,
  ERROR: chalk.red,
};

const LOG_LEVEL = process.env.FETCHFOX_LOG_LEVEL || process.env.FF_LOG || 'warn';

prefix.reg(log);
log.setLevel(LOG_LEVEL);

prefix.apply(log, {
  format(level, name, timestamp) {
    return `${chalk.gray(`[${timestamp}]`)} ${colors[level.toUpperCase()](level.padEnd(5, ' '))}`;
  },
});

prefix.apply(log.getLogger('critical'), {
  format(level, name, timestamp) {
    return chalk.red.bold(`[${timestamp}] ${level}:`);
  },
});

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
