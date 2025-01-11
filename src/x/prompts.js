import { Template } from '../template/Template.js';

export const categorize = new Template(
  ['urls', 'prompt'],
  `You are given a list of URLs, and your goal is to create rules for categorizing them. You will return the following:

- "categoryName": The name of this URL category
- "pattern": The URL pattern, with parameters indicated in :parameter format

You should return under a dozen categories, and may exclude some URLs if they do not fit with the general pattern of categories.

Additionally, focus on URLs relevant to the user prompt. You may IGNORE urls that aren't helpful for the search prompt (below).

Example of valid output:

{"categoryName": "article", "pattern": "https://example.com/article/:date/:id"}
{"categoryName": "author", "pattern": "https://example.com/author/:name"}

The list of URLs to categorize is below:
{{urls}}

Focus on URLs relevant the user prompt below, and ignore ones that are unlikely to be relevent:
{{prompt}}

Guidlines:
- Keep your regex SIMPLE

Follow these important rules:
- Your response MUST be VALID JSONL
- Each object must be a SINGLE link of JSON. Do NOT break JSON objects into multiple lines under any circumstances
`);

export const availableItems = new Template(
  ['url', 'html', 'prompt'],
  `You are part of a web scraping program, and you are analyzing a page for available data to scrape. Your goal is to see what information on the page could be turned into structured data.

You should return a list of JSON objects in JSONL format, where each object has the following fields

Additionally, focus on items relevant to the user prompt. You may IGNORE item types that aren't helpful for the search prompt (below).

- "item": 1-5 word description of the item that is available to scrape
- "schema": A dictionary showing the schema of this item. May have nested dictionaries/arrays

Examples of valid output:

{"item": "book" "schema": { "title": "Title of the book", "author": "Author of the book", "reviews": [ { "reviewer": "Name of the reviewer", "stars": "Number of stars, X.X / 5", "body": "Text of the review" } ] } }

{"item": "comment" "schema": { "username": "Username of the commenter", "points": "Number of points the comment received", "timestamp": "Time that the comment was posted, in standard ISO format", "text": "Text content of the review" } }

URL of the page: {{url}}

HTML of the page:
{{html}}

Focus on URLs relevant the user prompt below, and ignore ones that are unlikely to be relevent:
{{prompt}}

Guidlines:
- Ignore general categories like "site navigation" or "site links", focus on content and data unique to this page and domain

Follow these important rules:
- Your response MUST be VALID JSONL
- Each object must be a SINGLE link of JSON. Do NOT break JSON objects into multiple lines under any circumstances

`);

// - "cssSelector": A CSS selector that will find all of these items on the page. If one cannot be constructured, leave as null
// - "xpathSelector": An Xpath selector that will find all of these items on the page. If one cannot be constructured, leave as null
  // "cssSelector": null,
  // "xpathSelector": "//div[@class='comment-section']/div[@class='comment']"
  // "cssSelector": ".content .book-item",
  // "xpathSelector": null,
