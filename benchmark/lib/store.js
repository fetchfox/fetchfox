import { logger } from '../../src/log/logger.js';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument, TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';

const allScores = [];
let id = 0; // per parallel execution sequential id, combined with uuid

let docClient;

const getDocClient = () => {
  if (!docClient) {
    const client = new DynamoDBClient({});
    docClient = DynamoDBDocument.from(client);
  }
  return docClient;
}

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
  const docClient = getDocClient();

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
  } catch (error) {
    if (error.name === 'TransactionCanceledException') {
        logger.debug('Commit already registered, doing nothing.');
    } else {
      logger.warn(`Error registering commit: ${error}`);
    }
  }
}

const persistAllScores = async () => {
  const scoresTable = process.env.BENCH_SCORES_TABLE;

  const now = new Date();
  const timestamp = now.toISOString();
  const date = timestamp.split('T')[0];

  const commit = process.env.COMMIT || 'local';

  if (commit == 'local') {
    logger.debug(`Skipping putting aggregate scores in DynamoDB, logging to debug ${allScores.length} rows instead`);
    logger.debug(updated)
    return;
  }

  await registerCommit();

  logger.debug(`Putting aggregate scores in DynamoDB with ${allScores.length} rows`);
  const docClient = getDocClient();

  // batch update scores using AWS DynamoDB DocumentClient
  const BATCH_SIZE = 25; // DynamoDB batchWrite has a max of 25 items per batch

  for (let i = 0; i < allScores.length; i += BATCH_SIZE) {
    const batchItems = allScores.slice(i, i + BATCH_SIZE);
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
      } catch (error) {
        logger.warn('Batch write error:', error);
        retries--;
      }
      if (retries <= 0) {
        logger.error('Failed to write all score items to DB after retries');
        done = true;
      }
    }
  }
}

export const storeScores = async (scores) => {
  const rows = [];
  for (const score of scores) {
    // commit and id fields required for DynamoDB scores table
    // currently overwrites if commit / id already in database
    const row = {
      commit: score.commit || 'unknown', // partition key
      id: `${id++}#${randomUUID()}`, // sort key, must be string
      name: score.name || 'unknown',
      date: score.date || new Date().toISOString().split('T')[0],
      branch: score.branch || 'unknown',

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
  if (typeof after === 'function') {
    after(function() {
      // Persist scores after all tests in this process have finished
      persistAllScores().catch(err => {
        logger.error("Error persisting benchmark scores:", err);
      });
    });
    global.__persistHookRegistered = true;
  } else {
    logger.warn('Mocha global hook `after` is not available. The persistScores hook was not registered.');
  }
}
