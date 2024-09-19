import JSON5 from 'json5';
import modelData from '../data/models.json' assert { type: 'json' };

export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const getModelData = (provider, model) => {
  let modelStr = model;
  if (provider == 'groq') {
    modelStr = provider + '/' + model;
  }

  const data = modelData[modelStr];
  if (data?.litellm_provider != provider) {
    return null;
  }
  return data;
}

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
        .replace('```', '')
        .replaceAll(/^`+|`+$/g, '');

  if (format == 'jsonl') {
    const lines = clean.split('\n');
    const result = [];
    for (const line of lines) {
      try {
        result.push(trimJson(JSON5.parse(line))) }
      catch(e) {
        // Ignore
      }
    }
    return result;

  } else if (format == 'json') {
    try {
      const result = trimJson(JSON5.parse(clean));
      return result;
    } catch(e) {
      return {};
    }

  } else if (format == 'text') {
    return text;

  } else {
    return null;
  }
}
