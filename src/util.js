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
