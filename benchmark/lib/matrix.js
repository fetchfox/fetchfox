const s3 = {
  bucket: process.env.BENCH_BUCKET || 'ffcloud',
  region: process.env.BENCH_REGION || 'us-west-2',
  acl: 'public-read',
};

export const standardParams = () => {
  let ai;

  let fetcher;
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

  if (process.env.BENCH_MATRIX_FETCHER) {
    fetcher = process.env.BENCH_MATRIX_FETCHER.split(',');
  } else {
    fetcher = [
      ['playwright', { s3 }],
    ];
  }

  return {
    ai,
    fetcher,
  }
}

export const standardMatrix = (extra, options) => {
  const params = standardParams();

  return createMatrix({
    ...params,
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
          if (cdp && (options?.useCdp || process.env.BENCH_USE_CDP)) {
            val[1].cdp = cdp;
          }
        }
        newMatrix.push(updated);
      }
    }
    matrix = newMatrix;
  }

  return matrix;
}

const preprocessParamSpace = (paramSpace, options = {}) => {
  const cdp = process.env.CDP_URL;

  return Object.fromEntries(
    Object.entries(paramSpace).map(([key, values]) => {
      // Ensure values is always an array
      if (!Array.isArray(values)) {
        values = [values];
      }

      // Special handling for 'ai' and 'fetcher'
      if (['ai', 'fetcher'].includes(key)) {
        values = values.map(val => {
          if (!Array.isArray(val)) {
            val = [val];
          }
          if (val.length === 1) {
            val.push({}); // Provide default config object
          }

          // Inject CDP for 'fetcher'
          if (key === 'fetcher' && cdp && (options.useCdp || process.env.BENCH_USE_CDP)) {
            val[1].cdp = cdp;
          }

          return val;
        });
      }

      return [key, values];
    })
  );
};

// expands all combinations of paramSpace into configs after options
const objectCartesian = (paramSpace, options = {}) => {
  const keys = Object.keys(paramSpace);
  const values = Object.values(paramSpace);

  return values.reduce((acc, arr, i) => {
    const key = keys[i];

    return acc.flatMap(obj =>
      arr.map(val => {
        const updated = { ...obj };

        // Handle nested keys like 'test.format'
        if (key.includes('.')) {
          const path = key.split('.');
          let ref = updated;
          for (let j = 0; j < path.length - 1; j++) {
            ref[path[j]] = ref[path[j]] || {};
            ref = ref[path[j]];
          }
          ref[path[path.length - 1]] = val;
        } else {
          updated[key] = val;
        }

        return updated;
      })
    );
  }, [{ ...options }]);
};

// Works like old createMatrix but allows keys like test.format, adds options to config
export const newCreateMatrix = (paramSpace, options = {}) => {
  const processedSpace = preprocessParamSpace(paramSpace, options);
  const paramKeys = Object.keys(paramSpace);
  const matrix = objectCartesian(processedSpace, {...options, paramKeys});
  return matrix;
}

export const newStandardMatrix = (extra, options) => {
  const params = standardParams();

  return newCreateMatrix({
    ...params,
    ...extra,
  }, options);
}
