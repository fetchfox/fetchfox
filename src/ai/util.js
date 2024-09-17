import JSON5 from 'json5';
import modelData from '../data/models.json' assert { type: 'json' };

export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const getModelData = (provider, model) => {

  console.log('getModelData', provider, model);

  const data = modelData[model];
  if (data?.litellm_provider != provider) {
    return null;
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
      try { result.push(JSON5.parse(line)) } catch(e) {}
    }
    return result;

  } else if (format == 'json') {
    try {
      return JSON5.parse(clean);
    } catch(e) {
      return {};
    }

  } else if (format == 'text') {
    return text;

  } else {
    return null;
  }
}
