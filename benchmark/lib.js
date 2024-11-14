import os from 'os';

export const Stats = {
  mean: (arr) => {
    return arr.reduce((a, b) => a + b) / arr.length;
  },

  stdDev: (arr) => {
    const mean = Stats.mean(arr);
    const squareDiffs = arr.map(value => {
      const diff = value - mean;
      return diff * diff;
    });
    return Math.sqrt(Stats.mean(squareDiffs));
  },
}

export const runBenchmark = async (modelName, scrape, analyze, trials = 1, limit = 20, timeoutMs = 30000) => {

  const results = {
    trials: 0,
    successes: 0,
    failures: 0,
    accuracies: [],
    times: []
  };

  for (let i = 0; i < trials; i++) {
    results.trials++;
    
    try {
      const startTime = performance.now();
      const predictionsArray = await scrape(modelName, limit);
      const duration = performance.now() - startTime;
      
      // Convert array to JSONL string
      const predictionsJsonl = predictionsArray
        .map(obj => JSON.stringify(obj))
        .join('\n');
      const res = await analyze(predictionsJsonl, limit);
      
      // Accumulate results
      if (res.success) {
        results.successes++;
      }
      if (res.failure) {
        results.failures++;
      }
      results.accuracies.push(res.accuracy);
      results.times.push(duration);

    } catch (error) {
      results.failures++;
      console.error(`Trial ${i + 1} failed:`, error.message);
    }
  }

  // Return summary statistics
  return {
    trials: results.trials,
    successes: results.successes,
    failures: results.failures,
    meanAccuracy: results.accuracies.length > 0 ? 
    Stats.mean(results.accuracies) : 0,
    stdAccuracy: results.accuracies.length > 0 ? 
    Stats.stdDev(results.accuracies) : 0,
    meanTime: results.times.length > 0 ? 
    Stats.mean(results.times) : 0,
    stdTime: results.times.length > 0 ? 
    Stats.stdDev(results.times) : 0
  };
}

export const getAccuracy = (predictions, groundTruth, limit = 0) => {
  // If limit is specified and > 0, only compare that many items
  const n = limit > 0 ?
            Math.min(limit, predictions.length, groundTruth.length) :
            Math.min(predictions.length, groundTruth.length);
  
  let correct = 0;
  for (let i = 0; i < n; i++) {
    const gt = groundTruth[i];
    const pred = predictions[i];
    
    // Get ground truth keys and make case-insensitive comparison
    const gtKeys = Object.keys(gt);
    const matches = gtKeys.every(gtKey => {
      // Find corresponding prediction key ignoring case
      const predKey = Object.keys(pred).find(
        k => k.toLowerCase() === gtKey.toLowerCase()
      );
      return predKey && gt[gtKey] === pred[predKey];
    });
    
    if (matches) {
      correct++;
    }
  }
  
  return correct / n;
}

// Expand all combinations of parameters into Objects
export const objectCartesian = (paramSpace) => {
  const keys = Object.keys(paramSpace);
  const values = Object.values(paramSpace).map(v => 
    Array.isArray(v) ? v : [v]
  );
  
  return values.reduce((acc, arr, i) => 
    acc.flatMap(obj => 
      arr.map(val => ({...obj, [keys[i]]: val}))
    ), 
    [{}]
  );
};

export const benchmarkOptions = {
  cacheDir: os.tmpdir() + '/fetchfox-test-cache',
  ai: [
    // 'openai:gpt-4o',
    'openai:gpt-4o-mini',
    'google:gemini-1.5-flash',
  ],
}

export const matrix = () => {
  const ais = [
    'openai:gpt-4o',
    'openai:gpt-4o-mini',
    'google:gemini-1.5-flash',
  ];

  const configs = [];
  for (const ai of ais) {
    configs.push({ ai });
  }
  return configs;
}
