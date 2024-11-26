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

export const checkItemsExact = (items, expected) => {
  const score = [0, 0];

  const removePrivate = (item) => {
    const copy = {};
    for (const key of Object.keys(item)) {
      if (key.startsWith('_')) continue;
      copy[key] = item[key];
    }
    return copy;
  }

  // Un-ordered check, so sort them as JSON
  const itemsJson = items.map(x => JSON.stringify(removePrivate(x))).sort();
  const expectedJson = expected.map(x => JSON.stringify(removePrivate(x))).sort();

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
  return score;
}
