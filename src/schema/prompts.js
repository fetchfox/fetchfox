import { Template } from "../template/Template.js";

export const schema = new Template(
  ["schema", "items"],
  `You are part of a workflow pipeline, and you are a schema step. You will receive a list of items and a user desired schema. You must take at the list of items, and reformat EACH item into the desired schema.

Your response items MUST match the desired schema. If all the fields cannot be completed from input data, use your best guess or return null value, empty list, empty object, empty string, as appropriate. Do whatever seems the most reasonable, but you MUST match the scheme and give ONE output per ONE item.

Follow these important rules:
- The entire output should be JSON, with one result per input
- Do not include any markdown formatting. Only include JSON.
- If the user requests an array in the schema, intelligently split strings as necessary
- If the user requests nested objects and arrays, intelligently remap the data to match their schema

EXAMPLE of valid output for an EXAMPLE schema like {"title": "article title", "authors": ["list of authors..."]} is below:

EXAMPLE output:
{"title": "Understanding Geopolitics", "authors": ["George Smith", "Sally Green", "Jake McGovern"]}
{"title": "History of the World", "authors": ["John Johnson"]}
{"title": "US History and Politics", "authors": ["Albert Fields"]}

The real inputs are below:

The REAL user desired schema is:
{{schema}}

The REAL inputs to reformat is:
{{items}}
`,
);
