import CryptoJS from 'crypto-js';
import { logger } from './log/logger';

export const shuffle = (l) => {
  // Deterministic shuffle to keep prompts stable
  const h = (v) => CryptoJS.SHA256(JSON.stringify(v)).toString(CryptoJS.enc.Hex);
  l.sort((a, b) => h(a).localeCompare(h(b)));
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

export class Timer {
  constructor(options) {
    this.options = options ?? {};
    this.scopes = [];
    this.push(this.options.name ?? '<unnamed>');
    this.logString(this.topScope(), '=== TIMER INIT');
  }

  push(name) {
    const now = performance.now();

    this.scopes.push({
      name,
      start: now,
      time: now,
      depth: this.scopes.length ? this.scopes[this.scopes.length - 1].depth + 1 : 0,
    });
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
    return this.scopes[this.scopes.length - 1];
  }

  pop() {
    this.total();
    this.scopes.pop();
  }

  logString(scope, s) {
    const { useLogger, disabled } = this.options;
    if (disabled) return;

    const indentation = '    '.repeat(scope.depth);
    const name = scope.name ?? '<unnamed>';
    const output = `${indentation}[${name}] ${s}`;

    if (useLogger) {
      logger.info(output);
    } else {
      console.log(output);
    }
  }

  log(s) {
    const scope = this.topScope();

    const now = performance.now();
    const delta = now - scope.time;
    scope.time = now;

    this.logString(scope, `${delta} -- ${s}`);
  }

  total() {
    const scope = this.topScope();

    const now = performance.now();
    const delta = now - scope.start;
    scope.time = now;

    this.logString(scope, `${delta} TOTAL`);
  }
}
