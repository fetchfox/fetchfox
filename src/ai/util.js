import { models } from '../data/models.js';

export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const getModelData = (provider, model) => {
  let modelStr = model;
  if (['groq', 'mistral'].includes(provider)) {
    modelStr = provider + '/' + model;
  }
  return models[modelStr];
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
        result.push(trimJson(JSON.parse(line))) }
      catch(e) {
        // Ignore
      }
    }
    return result;

  } else if (format == 'json') {
    try {
      const result = JSON.parse(clean);
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
