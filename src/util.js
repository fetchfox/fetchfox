import crypto from 'crypto';

export const shuffle = (l) => {
  // Deterministic shuffle to keep prompts stable
  const h = (v) => crypto
    .createHash('sha256')
    .update(JSON.stringify(v))
    .digest('hex');
  l.sort((a, b) => h(a).localeCompare(h(b)));
  return l;
}

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

export const isPlainObject = (obj) => (
  Object.prototype.toString.call(obj) === '[object Object]' &&
  (obj.constructor === Object || typeof obj.constructor === 'undefined')
);

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
    }
  };
}

export const shortObjHash = (obj) => {
  const hash = crypto
    .createHash('sha256')
    .update(JSON.stringify(obj))
    .digest('hex')
    .substr(0, 16);
  return hash;
}
