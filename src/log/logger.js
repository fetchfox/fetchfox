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

const callbacks = [];

const send = (level, args) => {
  for (const cb of callbacks) {
    cb(level, args);
  }
}

export const addCallback = (level, cb) => {
  callbacks.push((level_, args) => {
    if (level_ == level) {
      cb(level, args);
    }
  });
}

class Logger {
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

    log.trace(...args);
    send('trace', args);
  }

  debug(...args) {
    if (this.disabled) {
      return;
    }

    if (log.getLevel() <= log.levels.DEBUG) {
      log.debug(...args);
    }
    send('debug', args);
  }

  info(...args) {
    if (this.disabled) {
      return;
    }

    log.info(...args);
    send('info', args);
  }

  warn(...args) {
    if (this.disabled) {
      return;
    }

    log.warn(...args);
    send('warn', args);
  }

  error(...args) {
    if (this.disabled) {
      return;
    }

    log.error(...args);
    send('error', args);
  }

  listen(cb) {
    if (this.disabled) {
      return;
    }

    callbacks.push(cb);
  }
}

export const logger = new Logger();
