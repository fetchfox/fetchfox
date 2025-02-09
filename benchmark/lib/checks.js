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
  console.log('checkAtLeast', items);
  return [
    Math.min(num, (items || []).length),
    num
  ];
}

export const checkItemsExact = (items, expected, fields) => {
  const score = [0, 0];

  const removePrivate = (item) => {
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

  // Un-ordered check, so sort them as JSON
  const itemsJson = items.map(x => JSON.stringify(removePrivate(x))).sort();
  const expectedJson = expected.map(x => JSON.stringify(removePrivate(x))).sort();

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

export const checkIncreasingSize = (items, minIncrease = 1000) => {
  const score = [1, 5];

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
