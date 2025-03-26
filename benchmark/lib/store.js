import { logger } from '../../src/log/logger.js';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument, TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import { srid } from '../../src/util.js';
import { summarize } from './summary.js';
import { score } from '../../src/crawl/prompts.js';

const allScores = [];
let id = 0; // per parallel execution sequential id, combined with uuid

const docClient = DynamoDBDocument.from(new DynamoDBClient());

const registerCommit = async () => {
  const commitsTable = process.env.BENCH_COMMITS_TABLE;
  const lookup = process.env.BENCH_LOOKUP || 'default';

  const now = new Date();
  const timestamp = now.toISOString();
  const date = timestamp.split('T')[0];

  const commit = process.env.COMMIT || 'local';
  const branch = process.env.BRANCH || 'unknown';

  if (commit == 'local') {
    logger.debug('Skipping registering commit in DynamoDB');
    return;
  }

  try {
    // Conditionally put commmit if not already there (transaction / lock)
    const transactParams = {
      TransactItems: [
        {
          Put: {
            TableName: commitsTable,
            Item: { lookup: "LOCK", timestamp: commit },
            ConditionExpression: 'attribute_not_exists(lookup)',
          }
        },
        {
          Put: {
            TableName: commitsTable,
            Item: { lookup, commit, branch, timestamp, date },
            ConditionExpression: 'attribute_not_exists(lookup)',
          }
        },
      ]
    }
    await docClient.send(new TransactWriteCommand(transactParams));
    logger.debug(`Registered commit ${commit}`)
  } catch (e) {
    if (e.name == 'TransactionCanceledException') {
        logger.debug('Commit already registered, doing nothing.');
    } else {
      throw new Error(`Error registering commit: ${e}`);
    }
  }
}

const persistAnalysis = async (scores) => {
  // aggregate analysis by name / config_ai
  const grouped = {};
  const rows = [];
  for (const score of scores) {
    const { name, config_ai: configAI, analysis } = score;
    const analyses = Array.isArray(analysis) ? analysis : [analysis];

    if (!grouped[name]) {
      grouped[name] = {};
    }
    if (!grouped[name][configAI]) {
      grouped[name][configAI] = [];
    }

    // Push the analysis data into the array
    grouped[name][configAI].push(...analyses);
  }

  for (const name of Object.keys(grouped)) {
    for (const configAI of Object.keys(grouped[name])) {
      const row = {
        name,
        config_ai: configAI,
        analysis: grouped[name][configAI],
      }
      rows.push(row);
    }
  }

  for (const row of rows) {
    if (!row.analysis.length) {
      row.analysis = '';
    } else if (row.analysis.length == 1) {
      row.analysis = row.analysis[0];
    } else {
      row.analysis = await summarize(row.analysis);
    }
  }

  console.log(rows);
  // TODO: persist to analysisTable
}

const persistAllScores = async () => {
  const scoresTable = process.env.BENCH_SCORES_TABLE;

  const now = new Date();
  const timestamp = now.toISOString();
  const date = timestamp.split('T')[0];

  const commit = process.env.COMMIT || 'local';

  if (commit == 'local') {
    logger.info(`Skipping putting aggregate scores in DynamoDB, displaying summary of ${allScores.length} rows instead`);
    const summary = async (scores) => {
      const results = [];
      const byName = {};

      let sum = 0;
      let count = 0;
      for (const score of scores) {
        const score_pct = score.score0 / score.score1;
        byName[score.name] ||= [];
        byName[score.name].push({
          name: score.name,
          score0: score.score0,
          score1: score.score1,
          score_pct,
          analysis: score.analysis,
        });
        if (!Number.isNaN(score_pct)) {
          sum += score_pct;
          count += 1;
        }
      }

      const allAnalyses = [];
      for (const name of Object.keys(byName)) {
        let sum = 0;
        let count = 0;
        let analyses = [];
        for (const score of byName[name]) {
          const score_pct = score.score_pct;
          if (!Number.isNaN(score_pct)) {
            sum += score_pct;
            count += 1;
          }
          const analysis = Array.isArray(score.analysis) ? score.analysis : [score.analysis];
          analyses.push(...analysis);
        }
        if (analyses.legnth == 0) {
          analyses = '';
        } else if (analyses.length == 1) {
          analyses = analyses[0];
        } else {
          analyses = await summarize(analyses);
        }
        const agg = {
          name: name + ' Mean',
          score_pct: sum / count,
          analysis: analyses,
        }
        results.push(agg);
        allAnalyses.push({
          benchmarkName: name,
          analyses,
        });
      }

      const analysis = allAnalyses.length > 1 ? await summarize(allAnalyses) : '';
      const agg = {
        name: "All Benchmarks Mean",
        score_pct: sum / count,
        analysis,
      };
      results.push(agg);

      return results;
    }

    logger.debug(JSON.stringify(allScores, null, 2));
    console.log(await summary(allScores));
    persistAnalysis(allScores);
    return;
  }

  await registerCommit();

  logger.debug(`Putting aggregate scores in DynamoDB with ${allScores.length} rows`);
  // persistAnalysis(allScores);

  // Exclude analysis from scoresTable
  for (const score of allScores) {
    delete score[analysis];
  }

  // batch update scores using AWS DynamoDB DocumentClient
  const batchSize = 25; // DynamoDB batchWrite has a max of 25 items per batch

  for (let i = 0; i < allScores.length; i += batchSize) {
    const batchItems = allScores.slice(i, i + batchSize);
    const requestItems = {
      [scoresTable]: batchItems.map(score => ({
        PutRequest: {
          Item: score
        }
      }))
    };

    let retries = 2;
    let unprocessedItems = requestItems;
    let done = false;
    while (!done) {
      try {
        const result = await docClient.batchWrite({ 
          RequestItems: unprocessedItems 
        });
        if (result.UnprocessedItems && Object.keys(result.UnprocessedItems).length) {
          logger.warn('Some items were not processed:', result.UnprocessedItems);
          retries--;
          unprocessedItems = result.UnprocessedItems
        } else {
          logger.debug('Batch write successful for scores:', batchItems.length);
          done = true;
        }
      } catch (e) {
        logger.warn('Batch write error:', e);
        retries--;
      }
      if (retries <= 0) {
        throw new Error('Failed to write all score items to DB after retries');
      }
    }
  }
}

export const storeAnalysis = async (scores) => {
  const rows = [];
  // TODO: implement
  for (const score of scores) {
    score;
  }
}

export const storeScores = async (scores) => {
  const rows = [];
  for (const score of scores) {
    // commit and id fields required for DynamoDB scores table
    // currently overwrites if commit / id already in database
    const row = {
      commit: score.commit || 'unknown', // partition key
      id: `${id++}#${srid()}`, // sort key, must be unique string
      name: score.name || 'unknown',
      date: score.date || new Date().toISOString().split('T')[0],
      branch: score.branch || 'unknown',
      analysis: score.analysis || '',

      score0: score.score[0] || 0,
      score1: score.score[1] || 0,

      first_msec: score.firstMsec,
      total_msec: score.totalMsec,

      cost_input: score.stats?.cost?.input ?? -1,
      cost_output: score.stats?.cost?.output ?? -1,
      cost_total: score.stats?.cost?.total ?? -1,

      tokens_input: score.stats?.tokens?.input ?? -1,
      tokens_output: score.stats?.tokens?.output ?? -1,
      tokens_total: score.stats?.tokens?.total ?? -1,

      runtime_msec: score.stats?.runtime?.msec ?? -1,
      runtime_sec: score.stats?.runtime?.sec ?? -1,

      requests_attempts: score.stats?.requests?.attempts ?? -1,
      requests_errors: score.stats?.requests?.errors ?? -1,
      requests_failures: score.stats?.requests?.failures ?? -1,

      // NOTE: We can store items later if needed. Leave it off
      // for now to avoid putting junk in the jsonl file.
      // items: scores.items || [],
    };

    for (const configKey of Object.keys(score.config)) {
      const val = score.config[configKey];
      let str = '';
      // Typically first entry is the name of it, eg. ai=openai:gpt-4o
      if (Array.isArray(val)) {
        str = val[0];
      } else {
        str = JSON.stringify(val);
      }
      row[`config_${configKey}`] = str;
    }
    logger.debug(`Aggregate this benchmark data: ${JSON.stringify(row)}`);
    allScores.push(row);
  }
}

/* Register a global after hook if it hasn't been registered already.
   This hook will run once after all tests complete in the current process.
   Since Mocha provides global functions like `after`, you can call it here.
   Note: Make sure that store.js is imported in the Mocha context (i.e., after Mocha
   sets up the global hooks) so that `after` is defined.
*/
if (!global.__persistHookRegistered) {
  // Check that the Mocha global `after` function is available.
  // It should be if this file is loaded within a test context.
  if (typeof after == 'function') {
    after(function() {
      // Persist scores after all tests in this process have finished
      persistAllScores().catch(e => {
        logger.error("Error persisting benchmark scores:", e);
      });
    });
    global.__persistHookRegistered = true;
  } else {
    logger.warn('Mocha global hook `after` is not available. The persistScores hook was not registered.');
  }
}
