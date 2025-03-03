import log from 'loglevel';
import chalk from 'chalk';
import prefix from 'loglevel-plugin-prefix';

const colors = {
  TRACE: chalk.magenta,
  DEBUG: chalk.blue,
  INFO: chalk.cyan,
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

  _suffix() {
    const lines = new Error().stack.split('\n');
    let filename;
    for (const line of lines) {
      if (!line.includes('fetchfox') || line.match(/src.log.logger/)) {
        continue;
      }
      const parts = line.split('/');
      const filepart = parts[parts.length - 1];//.replace(/^(.*):.+$/, '$1');
      const [filename_, lineno] = filepart.split(':');
      filename = filename_ + ':' + lineno;
      break;
    }
    return chalk.gray(filename);
  }

  _prefix() {
    return this.prefix ? `${this.prefix}` : '';
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

    log.trace(this._prefix(), ...args, this._suffix());
  }

  debug(...args) {
    if (this.disabled) {
      return;
    }

    if (log.getLevel() <= log.levels.DEBUG) {
      log.debug(this._prefix(), ...args, this._suffix());
    }
  }

  info(...args) {
    if (this.disabled) {
      return;
    }

    log.info(this._prefix(), ...args, this._suffix());
  }

  warn(...args) {
    if (this.disabled) {
      return;
    }

    log.warn(this._prefix(), ...args, this._suffix());
  }

  error(...args) {
    if (this.disabled) {
      return;
    }

    log.error(this._prefix(), ...args, this._suffix());
  }
}

export const logger = new Logger();
