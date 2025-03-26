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
  for (const key of Object.keys(item)) {
    if (!fields) {
      if (key.startsWith('_')) continue;
      copy[key] = item[key];

      continue;
    }

    if (!fields.includes(key)) continue;
    copy[key] = item[key];
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

- You may base your score on the approximate percentage of expected fields that are exactly matched in the actual results.
- However, you may give partial credit for responses that answer a question in a slightly different format if the corresponding question's wording allows it.
- For fields that are more subjective, like "tone" or "summary", you should not expect an exact match. Give full credit for differnces in subjective fields, as long as format is correct and the answers seem reasonable.

If there is a format discrepancy, try to determine if the answer is generally too short or too long, or still properly answers the question although it differs from the expected response.
In the analysis, ensure that the most important information is mentioned first: Start with an overall evaluation, noting any missing results or fields, any extra results or fields or other major mistakes, then less important issues and optionally correct fields. Also note any out of order results, and any format differences that still answer the question properly.
Try to provide a clear, concise and efficient overview that mentions all important differences. Avoid mentioning specific entries except as an example or unless results are otherwise nearly perfect.
You may assume that the reader expects information to refer to the actual results and differences to be from the expected results to the actual results unless otherwise mentioned. Results may say (not found) rather than be blank or null.

Format your response like this:

- "analysis": 20-200 word analysis of the differences between the actual and expected results. Note any missing rows or fields first, then other major mistakes.
- "score": Based on the analysis and data you see, give a score from 0 to 100 of how accurate the actual results are. 0 = terrible, completely different, 100 = perfect, exactly the same. MUST BE AN INTEGER

Example of valid response:
{
  "analysis": "Mostly accurate but username format differs. Results match in username and comments fields, but 1 result (of 10) is missing. Username format differs but still is valid.",
  "score": 85
}

-----

>>>> Questions:
${questions}

-----

>>>> Expected results:
${expectedStr}

-----

>>>> Actual results:
${itemsStr}

-----

Reminder:
In the analysis, ensure that the most important information is mentioned first:  Start with an overall evaluation, noting any missing results or fields, any extra results or fields or other major mistakes, then less important issues.  Also note any out of order results, and any format differences that still answer the question properly.
Try to provide a clear, concise and efficient overview.  Maintain a most to least important pattern.

Respond ONLY with JSON, as your reponse will be machine parsed using JSON.parse().`;
  const ai = getAI('google:gemini-2.0-flash');
  // const ai = getAI('openai:gpt-4o');
  const answer = await ai.ask(prompt, { format: 'json' });
  logger.info(answer.partial.analysis);

  logger.debug(`AI rating: score=${answer.partial.score} analysis=${answer.partial.analysis}`);

  return {
    score: [parseInt(answer.partial.score), 100],
    analysis: answer.partial.analysis,
  }
}

export const checkItemsExact = (items, expected, fields) => {
  const score = [0, 0];

  // Un-ordered check, so sort them as JSON
  const expectedJson = expected.map(x => JSON.stringify(removePrivate(x, fields))).sort();
  const itemsJson = items.map(x => JSON.stringify(removePrivate(x, fields))).sort();

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
