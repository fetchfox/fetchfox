import JSON5 from 'json5'

export const parseAnswer = (text) => {
  if (!text) return;
  const clean = text
        .replace(/```jsonl?/, '')
        .replace('```', '')
        .replaceAll(/^`+|`+$/g, '');

  // Try to parse it as JSON
  try {
    return JSON5.parse(clean);
  } catch(e) {
    // It was not JSON
  }

  // Try to parse it as JSONL
  let data;
  try {
    data = parseJsonl(clean);
  } catch (e) {
    console.warn('Unable to parse partial response:', clean, e);
  }
  if (data && data.length > 0) {
    return data;
  }

  // We don't know what it is, return null
  return text;
}

const parseJsonl = (str) => {
  const lines = str.split('\n');
  // console.log('parseJsonl', lines);
  const result = [];
  for (const line of lines) {
    try {
      result.push(JSON5.parse(line));
    } catch(e) {
      // console.warn('skipping invalid jsonl:', line);
    }
  }
  return result;
}
