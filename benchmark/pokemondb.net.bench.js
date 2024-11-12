import { fox } from '../src/index.js';
import fs from 'fs';
import { parse as parseCsv } from 'csv-parse/sync';
import { Stats, runBenchmark, getAccuracy } from './lib.js';

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
    const csvData = fs.readFileSync('benchmark/data/pokemon-ground-truth.csv', 'utf-8');
    const records = await parseCsv(csvData, {
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

describe('pokemondb.net', function() {
  this.timeout(5 * 60 * 1000);

  const modelNames = [
    'openai:gpt-4o-mini',
    'google:gemini-1.5-flash',
  ]

  console.log('benchmark');

  let modelName = modelNames[0];

  it('should benchmark pokemon @bench', async () => {
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
