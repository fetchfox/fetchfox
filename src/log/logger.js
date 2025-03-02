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

const envLogLevel = () => {
  return process.env.FETCHFOX_LOG_LEVEL || process.env.FF_LOG;
}

const LOG_LEVEL = envLogLevel() || 'warn';
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

export class Logger {
  constructor(options) {
    this.prefix = options?.prefix;
  }

  _prefix(level) {
    return this.prefix ? chalk.green(this.prefix) : '';
  }

  testMode() {
    if (envLogLevel()) {
      return;
    }
    this.disabled = true;
  }

  trace(...args) {
    if (this.disabled) {
      return;
    }

    log.trace(this._prefix(), ...args);
  }

  debug(...args) {
    if (this.disabled) {
      return;
    }

    if (log.getLevel() <= log.levels.DEBUG) {
      log.debug(this._prefix(), ...args);
    }
  }

  info(...args) {
    if (this.disabled) {
      return;
    }

    log.info(this._prefix(), ...args);
  }

  warn(...args) {
    if (this.disabled) {
      return;
    }

    log.warn(this._prefix(), ...args);
  }

  error(...args) {
    if (this.disabled) {
      return;
    }

    log.error(this._prefix(), ...args);
  }

  listen(cb) {
    if (this.disabled) {
      return;
    }

    callbacks.push(cb);
  }
}

export const logger = new Logger();
