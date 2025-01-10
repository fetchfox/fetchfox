export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const normalizeText = (text) => {
  const norm = text
    .replace(/[‘’]/g, "'") // Normalize curly single quotes to straight single quote
    .replace(/[“”]/g, '"') // Normalize curly double quotes to straight double quote
    .replace(/–/g, '-')    // Normalize en dash to hyphen
    .replace(/—/g, '-')    // Normalize em dash to hyphen
    .replace(/\.\.\./g, '…') // Normalize three dots to ellipsis
    .replace(/\s+/g, ' ')  // Replace multiple spaces with a single space
    .replace(/\u200B/g, '') // Remove zero width whitespace
    .replace(/(^\s+)|(\s+$)/g, '');
  return norm;
}

const trimJson = (data) => {
  for (const key in data) {
    data[key] = normalizeText('' + data[key]);
  }
  return data;
}

export const parseAnswer = (text, format) => {
  if (!text) return;

  const clean = text
        .replace(/```jsonl?/, '')
        .replaceAll('```', '')
        .replaceAll(/^`+|`+$/g, '');

  if (format == 'jsonl') {
    const lines = clean.split('\n');
    const result = [];
    let leftover = '';
    for (const line of lines) {

      console.log('jsonl line:    ', line);
      console.log('jsonl leftover:', leftover);

      if (leftover) {
        leftover += line;
        continue;
      }

      try {
        // const obj = trimJson(JSON.parse(line));
        const obj = JSON.parse(line);
        // console.log('parsed json line:', line, JSON.stringify(obj, null, 2));
        console.log('push jsonl obj...');
        result.push(obj);
      } catch {
        console.log('could not parse jsonl');
        leftover = line;
      }
    }
    return { result, leftover };

  } else if (format == 'json') {
    try {
      const result = JSON.parse(clean);
      return result;
    } catch {
      return {};
    }

  } else if (format == 'text') {
    return text;

  } else {
    return null;
  }
}
