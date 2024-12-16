import CryptoJS from 'crypto-js';
import { logger } from './log/logger';
import colors from 'colors/safe';

export const hashObject = (v) => {
  function sortKeysDeep(obj) {
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
      const sortedKeys = Object.keys(obj).sort();
      const ret = {};
      for (const key in sortedKeys) {
        ret[key] = sortKeysDeep(obj[key]);
      }
      return ret;
    }
    return obj;
  }
  return CryptoJS.SHA256(JSON.stringify(sortKeysDeep(v))).toString(CryptoJS.enc.Hex);
};

export const hashObjectShort = (v) => {
  return hashObject(v).slice(0, 16);
};

export const shuffle = (l) => {
  // Deterministic shuffle to keep prompts stable
  l.sort((a, b) => hashObject(a).localeCompare(hashObject(b)));
  return l;
};

export const chunkList = (list, maxBytes) => {
  const chunks = [];
  let current = [];
  for (let item of list) {
    current.push(item);
    if (JSON.stringify(current, null, 2).length > maxBytes) {
      chunks.push(current);
      current = [];
    }
  }
  if (current.length) {
    chunks.push(current);
  }
  return chunks;
};

export const isPlainObject = (obj) =>
  Object.prototype.toString.call(obj) === '[object Object]' &&
  (obj.constructor === Object || typeof obj.constructor === 'undefined');

let _WebSocket = null;
export async function getWebSocket() {
  if (_WebSocket) return _WebSocket;

  try {
    _WebSocket = WebSocket;
    return _WebSocket;
  } catch (e) {}

  try {
    _WebSocket = window.WebSocket;
    return _WebSocket;
  } catch (e) {}

  // Load it from module
  const wsModule = await import('ws');
  _WebSocket = wsModule.default;
  return _WebSocket;
}

export const createBlocker = () => {
  let doneResolvers = [];
  let isDone = false;

  return {
    wait() {
      if (isDone) {
        return Promise.resolve();
      }
      return new Promise((resolve) => {
        doneResolvers.push(resolve);
      });
    },
    done() {
      isDone = true;
      while (doneResolvers.length > 0) {
        const resolve = doneResolvers.shift();
        resolve();
      }
    },
    reset() {
      isDone = false;
    },
  };
};

export const createChannel = () => {
  const messages = [];
  const resolvers = [];
  let done = false;

  return {
    end() {
      done = true;

      while (resolvers.length > 0) {
        const resolve = resolvers.shift();
        resolve(Promise.resolve({ end: true }));
      }
    },
    send(value) {
      if (done) {
        throw new Error('Cannot send on done channel');
      }

      if (resolvers.length > 0) {
        const resolve = resolvers.shift();
        resolve(value);
      } else {
        messages.push(value);
      }
    },
    async *receive() {
      while (true) {
        if (messages.length > 0) {
          yield messages.shift();
        } else if (done) {
          yield Promise.resolve({ end: true });
        } else {
          const promise = new Promise((ok) => {
            resolvers.push(ok);
          });
          yield await promise;
        }
      }
    },
  };
};

class TimerScope {
  constructor(name, depth, timerOptions) {
    this.name = name;
    this.depth = depth;

    const now = performance.now();
    this.start = now;
    this.time = now;

    this.options = timerOptions;
  }

  logString(s) {
    const { useLogger, disabled } = this.options;
    if (disabled) return;

    const indentation = '    '.repeat(this.depth);
    const name = this.name ?? '<unnamed>';
    const output = `${indentation}[${name}] ${s}`;

    if (useLogger) {
      logger.info(output);
    } else {
      console.log(output);
    }
  }

  formatDelta(delta) {
    const output = `[${delta.toFixed(4)}ms]`;
    return delta >= 1000 ? colors.red(output) : output;
  }

  log(s) {
    const now = performance.now();
    const delta = now - this.time;
    this.time = now;

    this.logString(`${s} ${this.formatDelta(delta)}`);
  }

  total() {
    const now = performance.now();
    const delta = now - this.start;
    this.time = now;

    this.logString(`TOTAL ${this.formatDelta(delta)}`);
  }
}

export class Timer {
  constructor(options) {
    this.options = options ?? {};
    this.scopes = [];
    this.push(this.options.name ?? '<unnamed>');
    this.topScope().logString('=== TIMER INIT');
  }

  push(name) {
    const scope = this.topScope();
    const depth = scope ? scope.depth + 1 : 0;
    this.scopes.push(new TimerScope(name, depth, this.options));
  }

  async *withScopeGen(name, self, fn) {
    this.push(name);
    try {
      yield* fn.bind(self)(this);
    } finally {
      this.pop();
    }
  }

  async withScope(name, fn) {
    this.push(name);
    try {
      return await fn(this);
    } finally {
      this.pop();
    }
  }

  topScope() {
    if (!this.scopes.length) return null;
    return this.scopes[this.scopes.length - 1];
  }

  pop() {
    this.total();
    this.scopes.pop();
  }

  log = (s) => this.topScope().log(s);
  total = () => this.topScope().total();
}
