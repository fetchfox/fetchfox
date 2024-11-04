import CryptoJS from 'crypto-js';

export const shuffle = (l) => {
  // Deterministic shuffle to keep prompts stable
  const h = (v) => CryptoJS
    .SHA256(JSON.stringify(v))
    .toString(CryptoJS.enc.Hex);
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

let _WebSocket = null;
export async function getWebSocket() {
  if (_WebSocket) return _WebSocket;

  try {
    _WebSocket = WebSocket;
    return _WebSocket;
  } catch(e) {
  }

  try {
    _WebSocket = window.WebSocket;
    return _WebSocket;
  } catch(e) {
  }

  // Load it from module
  const wsModule = await import('ws');
  _WebSocket = wsModule.default;
  return _WebSocket;
}
