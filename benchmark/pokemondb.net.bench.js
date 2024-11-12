import { fox } from '../src/index.js';

import fs from 'fs/promises';
import { parse } from 'csv-parse/sync';  // or csv-parse/sync.js

// Simple statistics helper
class Stats {
  static mean(arr) {
      return arr.reduce((a, b) => a + b) / arr.length;
  }

  static stdDev(arr) {
      const mean = Stats.mean(arr);
      const squareDiffs = arr.map(value => {
          const diff = value - mean;
          return diff * diff;
      });
      return Math.sqrt(Stats.mean(squareDiffs));
  }
}

async function runBenchmark(modelName, scrape, analyze, trials = 1, limit = 20, timeoutMs = 30000) {
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

async function scrapePokemon(modelName, limit = 10) {
  const results = await fox
  .config({ ai: modelName})
  .init('https://pokemondb.net/pokedex/national')
  .extract({ name: 'Pokemon name', number: 'Pokemon number' })
  .limit(limit)
  .run();

  return results.items;
}

async function loadGtPokemon() {
  try {
      // Load and parse CSV
      const csvData = await fs.readFile('benchmark/data/pokemon_ground_truth.csv', 'utf-8');
      const records = await parse(csvData, {
          columns: true,
          skip_empty_lines: true
      });
      
      // Convert to JSONL format
      const jsonl = records.map(record => JSON.stringify(record)).join('\n');
      
      return jsonl;
  } catch (error) {
      console.error('Error loading ground truth:', error);
      throw error;
  }
}

async function analyzePokemon(predictionsJsonl, limit = 0) {
  const groundTruthJsonl = await loadGtPokemon();

  if (!predictionsJsonl) {
    return {
      success: false,
      failure: true,
      accuracy: 0,
      error: 'No predictions provided'
    };
  }

  console.log(predictionsJsonl);
  console.log(groundTruthJsonl);

  let predictions;
  let groundTruth;
  try {
    predictions = predictionsJsonl.trim()
      .split('\n')
      .map(line => JSON.parse(line));
    groundTruth = groundTruthJsonl.trim()
      .split('\n')
      .map(line => JSON.parse(line));
  } catch (error) {
    return {
      success: false,
      failure: true,
      accuracy: 0,
      error: 'Invalid JSONL format'
    };
  }

  const accuracy = getAccuracy(predictions, groundTruth, limit);
    
  return {
      success: accuracy === 1.0,
      failure: false,
      accuracy
  };
}

function getAccuracy(predictions, groundTruth, limit = 0) {
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
          console.log(gtKey, predKey, gt[gtKey], pred[predKey])
          return predKey && gt[gtKey] === pred[predKey];
      });
      
      if (matches) {
          correct++;
      }
  }
  
  return correct / n;
}

describe('pokemondb.net', function() {
  this.timeout(5 * 60 * 1000);

  const modelNames = [
    'openai:gpt-4o-mini',
    'google:gemini-1.5-flash',
  ]

  console.log('benchmark');

  let modelName = modelNames[0];

  it('should benchmark pokemon', async () => {
    const results = await runBenchmark(
      modelName,
      scrapePokemon,
      analyzePokemon,
      2,
      20,
    );

    console.log(JSON.stringify(results, null, 2));
  })

})
