export const standardMatrix = (extra) => {
  return createMatrix({
    ai: [
      'openai:gpt-4o-mini',
      'openai:gpt-4o',
      'google:gemini-1.5-flash',
      'google:gemini-1.5-pro',
      'groq:llama-3.1-70b-versatile',
      'groq:llama-3.2-11b-vision-preview',
      'groq:llama-3.2-90b-vision-preview',
    ],
    fetcher: [
      'fetch',
      'playwright',
    ],
    ...extra,
  });
}

export const createMatrix = (configs) => {
  let matrix = [{}];

  for (const key of Object.keys(configs)) {
    const newMatrix = [];
    for (const val of configs[key]) {
      for (const existing of matrix) {
        const updated = { ...existing };
        updated[key] = val;
        newMatrix.push(updated);
      }
    }
    matrix = newMatrix;
  }

  return matrix;
}
