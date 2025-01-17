import crypto from 'crypto';
import { logger } from './log/logger.js';

export const shuffle = (l) => {
  // Deterministic shuffle to keep prompts stable
  const h = (v) => crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
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

export const shortObjHash = (obj) => {
  const hash = crypto.createHash('sha256').update(JSON.stringify(obj)).digest('hex').substr(0, 16);
  return hash;
};

export const abortable = async (signal, promise) => {
  const resultPromise = promise
    .then((result) => {
      return { aborted: false, result };
    })
    .catch((e) => {
      if (signal?.aborted) {
        return { aborted: true };
      }
      logger.error(`Abortable got error: ${e}`);
      throw e;
    });

  if (!signal) {
    return resultPromise;
  }

  let abortListener;
  const signalPromise = new Promise((ok) => {
    if (signal.aborted) {
      logger.debug(`Already aborted`);
      ok({ aborted: true });
      return;
    }

    abortListener = () => {
      logger.debug(`Got abort signal`);
      ok({ aborted: true });
    };
    signal.addEventListener('abort', abortListener);
  });

  try {
    const result = await Promise.race([resultPromise, signalPromise]);
    return result;
  } finally {
    signal.removeEventListener('abort', abortListener);
  }
};
