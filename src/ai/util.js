import { logger } from '../log/logger.js';

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
      if (leftover.trim()) {
        leftover += line.trim();
        continue;
      }

      try {
        result.push(trimJson(JSON.parse(line))) }
      catch {
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

export const getModelData = async (provider, model, cache) => {
  let id = `${provider}/${model}`
    .replace('gemini/', 'google/')
    .replace('-latest', '')
    .replace('claude-3-5', 'claude-3.5')
    .replace(/(claude-3.5-[a-z]+).*/, '$1');

  let data
  const key = 'openrouter-model-data-' + id;
  if (cache) {
    const cached = await cache.get(key);
    if (cached) {
      data = cached;
    }
  }

  const trans = {
    'google/gemini-1.5-flash': 'google/gemini-flash-1.5',
    'google/gemini-1.5-pro': 'google/gemini-pro-1.5',
  };
  if (trans[id]) {
    id = trans[id];
  }

  if (!data) {
    const url = 'https://openrouter.ai/api/v1/models';

    logger.debug(`Calling ${url} to get model data for ${id}`);

    const resp = await fetch(url);
    const jsonData = await resp.json();

    for (let item of jsonData.data) {
      if (item.id == id) {
        data = {
          ...item,
          max_input_tokens: item.context_length
        };
      }
    }
  }

  if (!data) {
    logger.warn(`Could not find model data in OpenRouter API: ${id}`);

    return {
      maxTokens: 128000,
      pricing: {
        input: 0,
        output: 0,
      }
    };
  }

  if (cache) {
    cache.set(key, data).catch(() => {});
  }

  return {
    maxTokens: data.max_input_tokens,
    pricing: {
      input: parseFloat(data.pricing?.prompt || 0),
      output: parseFloat(data.pricing?.completion || 0),
    },

  };
}
