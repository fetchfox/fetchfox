import { Template } from '../template/Template.js';

export const filter = new Template(
  ['query', 'items'],
  `You are part of a workflow pipeline, and you are a filter step. You will receive a list of items and a user filter prompt. You will rate the percent match to the filter, and return the object.

Aside from adding a field for percent match, everything else in the item must stay exactly the same. The percent match field will look like this

- "_percentMatch": A number from 0 to 100 indicating how close of a match this item is to the filter. 0 = complete mismatch, 50 = somewhat matches, 100 = perfect match. Scores at or above 80 are considered a good match that will be returned to the user. Format: Number

The _percentMatch field should be the last item in the JSON object.

Example:

{"title": "Example title 1", "author": "Example author 1", "_percentMatch": 70}
{"title": "Example title 2", "author": "Example author 2", "_percentMatch": 85}

The results should be JSONL, with a single object per line.

>>> The user items are:
{{items}}

>>> The user filter is:
{{query}}

Return ONLY items matching this filter`);
