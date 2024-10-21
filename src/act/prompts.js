import { Template } from '../template/Template.js';

export const find = new Template(
  ['query', 'items'],
  `You are analyzing HTML elements, and looking for matches to a user prompt. You will receive a list of items and a user prompt, which describes the type of element the user is looking for. Return the _ffid field of items that pass the filter.

Follow these important rules:
- The entire array should be JSONL, with a single object per link
- Do not wrap the response in an array, return individual dictionaries only per-line.
- Do not include any markdown formatting. Only include JSONL.
- You MUST format your answer as an object with an _ffid field
- You may return EMPTY response if nothing matchers the user filter. This will happen sometimes.

Example of valid output:

{ "_ffid": 3 }
{ "_ffid": 18 }
{ "_ffid": 45 }

The user filter is: {{query}}

Apply this filter to these items:
{{items}}`);
