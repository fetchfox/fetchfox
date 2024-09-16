import JSON5 from 'json5';

export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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

const parseJsonl = (str) => {
}
