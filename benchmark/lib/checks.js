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

  // Un-ordered check, so sort them as JSON
  const itemsJson = items.map(x => JSON.stringify(x)).sort();
  const expectedJson = expected.map(x => JSON.stringify(x)).sort();

  for (let i = 0; i < expectedJson.length; i++) {
    score[1]++;
    if (i >= items.length) continue;
    const e = expectedJson[i];
    const item = itemsJson[i];
    if (e != item) continue;
    score[0]++;
  }
  return score;
}
