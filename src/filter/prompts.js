import { Template } from '../template/Template.js';

export const filter = new Template(
  ['query', 'items'],
  `You are part of a workflow pipeline, and you are a filter step. You will receive a list of items and a user filter prompt. You must look at the list of items, and pick out only the ones that MATCH the user filter prompt.

Your response will be ONLY the "_ffid" field of matching items. The "_ffid" field will be used to generate the results later, you only need to include the "_ffid" field.

Follow these important rules:
- The entire array should be JSONL, with a single object per item
- Do not wrap the response in an array, return individual dictionaries only per-line.
- Do not include any markdown formatting. Only include JSONL.
- Respond with [] if nothing matches the prompt.
- Find all the matches, and err on the side of overmatching, especially if the user prompt is short

Example of valid output:

{ "_ffid": 3 }
{ "_ffid": 18 }
{ "_ffid": 45 }

The user is looking for: {{query}}

The list to find this is below:
{{items}}`);
