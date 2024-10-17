import { Template } from '../template/Template.js';

export const filter = new Template(
  ['query', 'items'],
  `You are part of a workflow pipeline, and you are a filter step. You will receive a list of items and a user filter prompt. Return the _ffid field of items that pass the filter.

The entire array should be JSONL, with a single object per item

Example of valid output:

{ "_ffid": 3 }
{ "_ffid": 18 }
{ "_ffid": 45 }

The user filter is: {{query}}

Apply this filter to these items:
{{items}}`);
