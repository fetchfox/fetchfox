import { logger } from '../../src/log/logger.js';
import { getAI } from '../../src/ai/index.js';

export const checkExcludeUrls = (items, str) => {
  const score = [0, 0];
  for (const item of items) {
    score[1]++;
    if (typeof item.url != 'string') continue;
    if (item.url.indexOf(str) != -1) continue;
    score[0]++;
  }
  return score;
}

export const checkAtLeast = (items, num) => {
  return [
    Math.min(num, (items || []).length),
    num
  ];
}

const removePrivate = (item, fields) => {
  const copy = {};
  if (fields) {
    for (const field of fields) {
      copy[field] = item[field];
    }
    return copy;
  } else {
    for (const key of Object.keys(item)) {
      if (key.startsWith('_')) continue;
      copy[key] = item[key];
    }
  }

  return copy;
}


export const checkItemsAI = async (items, expected, questions, fields) => {
  if (!fields) {
    fields = Object.keys(removePrivate(expected[0]));
  }

  // Un-ordered check, so sort them as JSON
  const expectedJson = expected.map(x => JSON.stringify(removePrivate(x, fields))).sort();
  const itemsJson = items.map(x => JSON.stringify(removePrivate(x, fields))).sort();

  const expectedStr = expectedJson.length ? expectedJson.join('\n') : '[]';
  const itemsStr = itemsJson.length ? itemsJson.join('\n') : '[]';

  const prompt = `Give a score from 0 to 100 of how closely the actual results match the expected results.

- You may based your score on the approximate percentage of expected fields that are exactly matched in the actual results.
- However, you may give partial credit for responses that answer a question in a slightly different format if the corresponding question's wording allows it.
- For fields that are subjective, like "tone" or "summary", you should not expect an exact match. Give full credit for differnces in subjective fields, as long as format is correct and the answers seem reasonable.
- For objective fields, however, do expect an exact match

Format your response like this:

- "analysis": 50-200 word analysis of the differences between the actual and expected results. Note any missing results, mistakes specifically.
- "score": Based on the analysis and data you see, give a score from 0 to 100 of how good the actual results are. 0 = terrible, completely different, 100 = perfect, exactly the same. MUST BE AN INTEGER

Example of valid response:
{
  "analysis": "The actual results show username and comments, and those match the expected results, except the format of the username is wrong. Also, one result is missing.",
  "score": 70
}

>>> Questions:
${questions}

>>> Expected results:
${expectedStr}

>>> Actual results:
${itemsStr}

>>> Additional guidance for scoring this specific result set:
${hint}

Respond ONLY with JSON, as your reponse will be machine parsed using JSON.parse().`;

  const ai = getAI('openai:gpt-4o');
  const answer = await ai.ask(prompt, { format: 'json' });
  logger.info(answer.partial.analysis);

  logger.debug(`AI rating: score=${answer.partial.score} analysis=${answer.partial.analysis}`);

  return [parseInt(answer.partial.score), 100];
}

export const checkItemsExact = (items, expected, fields) => {
  const score = [0, 0];

  // Un-ordered check, so sort them as JSON
  const expectedJson = expected.map(x => JSON.stringify(removePrivate(x, fields))).sort();
  console.log('expectedJson', expectedJson);

  const itemsJson = items.map(x => JSON.stringify(removePrivate(x, fields))).sort();
  console.log('itemsJson', itemsJson);

  // Check that all expected are found
  for (let i = 0; i < expectedJson.length; i++) {
    score[1]++;
    if (i >= items.length) continue;
    const e = expectedJson[i];
    let found = false;
    for (const it of itemsJson) {
      if (it == e) found = true;
    }
    if (!found) continue;
    score[0]++;
  }

  // Check for extras
  for (let i = 0; i < itemsJson.length; i++) {
    const it = itemsJson[i];
    let found = false;
    for (const e of expectedJson) {
      if (it == e) found = true;
    }
    if (found) continue;
    score[1]++;
  }

  return score;
}

export const checkIncreasingSize = (items, size = 5, minIncrease = 1000) => {
  const score = [1, size];

  if (!items || !items[0]) {
    return score;
  }

  let last = items[0];
  if (!last.html) {
    return score;
  }

  for (let i = 1; i < items.length; i++) {
    const current = items[i];
    if (
      current.html &&
      last.html &&
      current.html.length > last.html.length + minIncrease)
    {
      score[0]++;
    }
    last = current;
  }

  return score;
}
