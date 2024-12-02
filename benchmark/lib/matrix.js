export const standardMatrix = (extra, options) => {
  return createMatrix({
    ai: [
      'openai:gpt-4o-mini',
      'openai:gpt-4o',
      'google:gemini-1.5-flash',
      'google:gemini-1.5-pro',

      // Disabled due to rate limits on our account
      // 'groq:llama-3.1-70b-versatile',
      // 'groq:llama-3.2-11b-vision-preview',
      // 'groq:llama-3.2-90b-vision-preview',
    ],
    fetcher: [
      'fetch',
      'playwright',
    ],
    ...extra,
  }, options);
}

export const createMatrix = (configs, options) => {
  const cdp = process.env.CDP_URL;

  let matrix = [{}];

  for (const key of Object.keys(configs)) {
    const newMatrix = [];
    for (let val of configs[key]) {
      if (!Array.isArray(val)) {
        val = [val];
      }
      if (val.length == 1) {
        val.push({});
      }

      for (const existing of matrix) {
        const updated = { ...existing };
        updated[key] = val;
        if (cdp && (options?.useCdp || process.env.BENCH_USE_CDP)) {
          val[1].cdp = cdp;
        }
        newMatrix.push(updated);
      }
    }
    matrix = newMatrix;
  }

  return matrix;
}
