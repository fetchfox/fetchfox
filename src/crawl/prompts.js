import { Template } from "../template/Template.js";

export const gather = new Template(
  ["query", "links"],
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
{{links}}`,
);

export const rate = new Template(
  ["query", "links"],
  `You are part of a web scraping program, and your goal is to rate links based on the chance that they contain a target item.

You will receive a list of links with ID's, and you will return a rating result as follows:

- "id": The ID of the link you are rating. This must be exactly as you received it.
- "isTargetRating": On a scale from 0-100, the likelihood that this page is the target of the query. If the page may contain some targets, but is primarly links to targets, score LOW on this rating
- "linksToTargetRating": On a scale from 0-100, the likelihood that this page links to the target. The rating should HIGH for pages that will contain many links, and LOW for pages that are not primarly about linking to target pages. Target pages typically will score low on this rating.

Follow these important rules:
- The entire array should be JSONL, with a single object per link
- Do not wrap the response in an array, return individual dictionaries only per-line.
- Do not include any markdown formatting. Only include JSONL.

The FIRST results of your output should be a "meta" result, which has two fields:

- "meta": true
- "critera": explain your rating strategy in under 100-300 characters, focus on tricky parts and how to distinguish target pages and linking pages

You should OMIT results that are too low scoring to be useful.

Example of valid output:

{ "meta": true, "strategy": "I will look for pages likely to contain articles, and distinguish general categories and comments from actual article, and also... "}
{ "id": 3, "isTargetRating": 88, "linksToTargetRating": 23 }
{ "id": 18, "isTargetRating": 11, "linksToTargetRating": 5 }
{ "id": 45, "isTargetRating": 23, "linksToTargetRating": 70 }

Find links matching the user query: {{query}}

The list to find this is below:
{{links}}`,
);

export const categorize = new Template(
  ["urls"],
  `You are given a list of URLs, and your goal is to create rules for categorizing them. You will return the following:

- "categoryName": The name of this URL category
- "urlPattern": The URL pattern, with parameters indicated in :parameter format
- "regex": A regex for matching this URL pattern. This regex should be a STRING that can be parsed by Javascript new RegExp();

You should return under a dozen categories, and may exclude some URLs if they do not fit with the general pattern of categories.

Example of valid output:

{"categoryName": "article", "urlPattern": "https://example.com/article/:date/:id", "regex": "https:\\/\\/example.com\\/article\\/[0-9]{4}-[0-9]{2}-[0-9]{2}/[a-f0-9]+"}
{"categoryName": "author", "urlPattern": "https://example.com/author/:name", "regex": "https:\\/\\/example.com\\/author\\/[a-z\-]+"}

Follow these important rules:
- The entire array should be JSONL, with a single object per link
- Do not wrap the response in an array, return individual dictionaries only per-line.
- Do not include any markdown formatting. Only include JSONL.

The list of URLs to categorize is below:
{{urls}}
`,
);

export const score = new Template(
  ["html", "questions"],
  `You part of a web scrapign program, and you are scoring a data source for completeness.

You will receive HTML, a scraping target, and a list of questions for extraction. You are to determine whether the targetted data is present on the page, or not. You are one of several raters like this, and your rating will be used to determine the best pages to extract data from.

Your response must use the keys in the user's question object, and you must EXACTLY match those keys. The values will be 'found' or 'missing', indicated whether or not the data is present on the page.

Example valid response:

{
  "exampleField1": "found",
  "exampleField2": "found",
  "exampleField3": "missing"
}

Follow these important rules:
- Return ONLY valid JSON. Your response will be parsed by JSON.parse()

Below is the USER PROMPT that you are responding to:

>>>> The HTML to evaluate is below:
{{html}}

>>>> The user is extracting this data:
{{questions}}`,
);
