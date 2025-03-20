const s3 = {
  bucket: process.env.BENCH_BUCKET || 'ffcloud',
  region: process.env.BENCH_REGION || 'us-west-2',
  acl: 'public-read',
};

export const standardMatrix = (extra, options) => {
  let ai;

  const fetcher = [
    ['playwright', { s3 }],
  ];
  if (process.env.BENCH_HEADFUL) {
    fetcher[0][1].headless = false;
  }

  if (process.env.BENCH_MATRIX_AI) {
    ai = process.env.BENCH_MATRIX_AI.split(',');
  } else {
    ai = [
      'openai:gpt-4o-mini',
      'openai:gpt-4o',
      'google:gemini-1.5-flash',
      'google:gemini-1.5-pro',
    ];
  }


  return createMatrix({
    ai,
    fetcher,
    ...extra,
  }, options);
}

export const createMatrix = (configs, options) => {
  const cdp = process.env.CDP_URL;

  let matrix = [{}];

  for (const key of Object.keys(configs)) {
    const newMatrix = [];
    for (let val of configs[key]) {
      if (['ai', 'fetcher'].includes(key)) {
        if (!Array.isArray(val)) {
          val = [val];
        }
        if (val.length == 1) {
          val.push({});
        }
      }

      for (const existing of matrix) {
        const updated = { ...existing };
        updated[key] = val;
        if (key == 'fetcher') {
          // val[1].wait = 10 * 1000;
          if (cdp && (options?.useCdp || process.env.BENCH_USE_CDP)) {
            val[1].cdp = cdp;
            val[1].timeout = 120 * 1000;
          }
        }
        newMatrix.push(updated);
      }
    }
    matrix = newMatrix;
  }

  return matrix;
}
