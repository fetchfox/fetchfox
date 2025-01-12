import { Template } from '../template/Template.js';

export const categorize = new Template(
  ['urls', 'prompt'],
  `You are given a list of URLs, and your goal is to create rules for categorizing them. You will return a list of URL patterns. Url patterns precede parameters in the URLs with ":", and they can be used to match URLs and categorize them. The parameters describe what they typically contain: an ID, a name, a date, a username, etc.

You should usually return under a dozen categories, and may exclude some URLs if they do not fit with the general pattern of categories.

Additionally, focus on URLs relevant to the user prompt. You may IGNORE urls that aren't helpful for the search prompt (below).

The list of URLs to categorize is below:
{{urls}}

Focus on URLs relevant the user prompt below, and ignore ones that are unlikely to be relevent:
{{prompt}}

Follow these important rules:
- Return ONLY the links, line-by-line
- Your response will be machine parsed

Example of valid output:

https://example.com/article/:date/:id
https://example.com/author/:name

You can give precedence rules. For example, the two links below show a longer one that matches before the shorter, more general rule:

https://example.com/article/global/:id
https://example.com/article/:id
`);

export const availableItems = new Template(
  ['url', 'html', 'prompt'],
  `You are part of a web scraping program, and you are analyzing a page for available data to scrape. Your goal is to see what information on the page could be turned into structured data.

You should return a list of JSON objects in JSONL format, where each object has the following fields

Additionally, focus on items relevant to the user prompt. You may IGNORE item types that aren't helpful for the search prompt (below).

- "item": 1-5 word description of the item that is available to scrape
- "schema": A dictionary showing the schema of this item. May have nested dictionaries/arrays

Examples of valid output:

{"item": "book", "schema": { "title": "Title of the book", "author": "Author of the book", "reviews": [ { "reviewer": "Name of the reviewer", "stars": "Number of stars, X.X / 5", "body": "Text of the review" } ] } }
{"item": "comment", "schema": { "username": "Username of the commenter", "points": "Number of points the comment received", "timestamp": "Time that the comment was posted, in standard ISO format", "text": "Text content of the review" } }

URL of the page:
{{url}}

HTML of the page:
{{html}}

Focus on URLs relevant the user prompt below, and ignore ones that are unlikely to be relevent
{{prompt}}

Guidlines:
- Ignore general categories like "site navigation" or "site links", focus on content and data unique to this page and domain
- Include AT MOST three (3) types of items
- Rank the items in order of most salient
- Schema fields and items MUST ONLY be for data on THIS PAGE
- The DATA MUST be present on this page. This directive takes precedence over the user prompt instruction from above.
- Do not return actual data, you must return a SCHEMA which is a DESCRIPTION of data

Follow these important rules:
- Your response MUST be VALID JSONL
- Each object must be a SINGLE link of JSON. Do NOT break JSON objects into multiple lines under any circumstances
`);

export const pickRelevant = new Template(
  ['url', 'prompt', 'linksTo'],
  `You are given some data about a website, and a user data extraction prompt. The data about the website includes URL patterns that the website links to. Your goal is to pick out the URL patterns most likely to relate to the user's prompt.

The website URL is:
{{url}}

The user prompt is:
{{prompt}}

The site data is:
{{linksTo}}

Follow these important rules:
- Return ONLY the links, line-by-line
- Your response will be machine parsed
- Give only a handful of respoinses

Example of valid output:

https://example.com/article/:date/:id
https://example.com/author/:name
`);
