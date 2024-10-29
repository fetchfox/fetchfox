import { Template } from '../template/Template.js';

export const gather = new Template(
  ['query', 'links'],
  `You are part of a web crawling program, and your goal is to pick out relevant links in a list. The list contains the inner text of links, and also their URLs. You will take this list, look for links that match the user prompt, and generate a new list of only the matching items.

Your response will be ONLY the "id" field of matching items. The "id" field will be used to generate the results later, you only need to include the "id" field.

Follow these important rules:
- The entire array should be JSONL, with a single object per link
- Do not wrap the response in an array, return individual dictionaries only per-line.
- Do not include any markdown formatting. Only include JSONL.
- Generally avoid links with no link text.
- Respect user filter requests, if any
- Often, but not always, the links you match will follow a similar pattern. If you notice that a handful match a similar pattern, the rest likely will too.

Example of valid output:

{ "id": 3 }
{ "id": 18 }
{ "id": 45 }

Find links matching the user query: {{query}}

The list to find this is below:
{{links}}`);
