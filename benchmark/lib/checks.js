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


export const checkItemsAI = async (items, expected, fields) => {
  // Un-ordered check, so sort them as JSON
  const expectedJson = expected.map(x => JSON.stringify(removePrivate(x, fields))).sort();
  const itemsJson = items.map(x => JSON.stringify(removePrivate(x, fields))).sort();

  const prompt = `Give a score from 1 to 100 of how closely the actual results match the expected results.

Format your response like this:

{
  "analysis": "20-50 word analysis of the differences between the actual and expected results",
  "score": "based on the analysis and data you see, giv ea score from 1 to 100 of how good the actual results are. 0 = terrible, completely different, 100 = perfect, exactly the same. MUST BE AN INTEGER"
}

>>>> Expected results:
${expectedJson.join('\n')}

>>>> Actual results:
 ${itemsJson.join('\n')}

Respond ONLY with JSON, as your reponse will be machine parsed using JSON.parse().`;

  const ai = getAI('openai:gpt-4o');
  const answer = await ai.ask(prompt, { format: 'json' });
  return [parseInt(answer.partial.score), 100];
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
