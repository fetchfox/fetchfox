import { Template } from '../template/Template.js';

export const availableItems = new Template(
  ['urls', 'htmls', 'prompt'],
  `You are part of a web scraping program, and you are analyzing a set of pages for available data to scrape. Your goal is to see what information on the page could be turned into structured data. The pages are expected to be similar.

You should return a list of JSON objects in JSONL format, where each object has the following fields

Additionally, focus on items relevant to the user prompt. You may IGNORE item types that aren't helpful for the search prompt (below).

- "item": 1-5 word description of the item that is available to scrape
- "example": A JSON example of this item FROM THIS PAGE, do NOT include any data that is not available on this page
- "template": A dictionary showing the template of this item. May have nested dictionaries/arrays. Must exactly match the example
- "perPage": Either "single" if there is one of these item per page, or "multiple" if there is multiple of these items per page

Examples of valid output:

{"item": "book", "template": { "title": "Title of the book", "author": "Author of the book", "reviews": [ { "reviewer": "Name of the reviewer", "stars": "Number of stars, X.X / 5", "body": "Text of the review" } ] } }
{"item": "comment", "template": { "username": "Username of the commenter", "points": "Number of points the comment received", "timestamp": "Time that the comment was posted, in standard ISO format", "text": "Text content of the review" } }

URLs of the pages:
{{urls}}

HTML samples of the page:
{{htmls}}

Focus on URLs relevant the user prompt below, and ignore ones that are unlikely to be relevent
{{prompt}}

Guidlines:
- Ignore general categories like "site navigation" or "site links", focus on content and data unique to this page and domain
- Include 1 to 3 types of items
- Return data that is on *this page*, not data that is linked from it

Follow these important rules:
- Provide a SINGLE result for the multiple page samples you give. Look for COMMONALITIES between the pages.
- Your response MUST be VALID JSONL
- Each object must be a SINGLE link of JSON. Do NOT break JSON objects into multiple lines under any circumstances
`);


export const availableLinks = new Template(
  ['htmls', 'urls', 'prompt'],
  `You are given a simplified HTML that inludes text and <a> tags. Your goal is to create rules for categorizing them links. You will return a list of URL patterns in JSONL format. URLs patterns precede parameters in the URLs with ":", and they can be used to match URLs and categorize them. The parameters describe what they typically contain: an ID, a name, a date, a username, etc.

Additionally, try to focus on URLs relevant to the user prompt. Relevant URLs are ones that directly relate to the user prompt, or they can contain indirectly link to the user prompt.

Each JSONL object contains these fields:
- "description": A description of the URL pattern, 4-10 words, plain English
- "relevancy": Describe if and how the URL pattern relates to the user scraping prompt, 4-10 words, plain English
- "category": A category name for the URL pattern, 1-4 words, dash-case
- "pattern": The URL pattern itself, full absolute matcher starting with http:// or https://
- "regex": A regex to match URLs to this pattern, full absolute matcher starting with http:// or https://
- "examples": An array of a few representative examples from the given data

Follow these important rules and guidelines:
- Return ONLY JSONL. Your response will be machine parsed using JSON.parse() on a line-by-line basis, splitting in \\n
- Avoid long, overly specific matchers
- Pattern variable names must have ONLY alphabetical characters
- Find ALL the URL patterns you notice. Use contextual and domain knowledge that you have.

Example of valid output:

{"description": "an individual article page", "relevancy": "articles may contain data about gold market", "category": "article", "pattern": "https://example.com/article/:date/:id", "regex": "...", "examples": ["https://example.com/article/2024-01-05/4444", "https://example.com/article/2022-05-11/5555"]}
{"description": "an author's profile page", "relevancy": "low relevance, but authors may be experts in gold market", "category": "author-profile", "pattern": "https://example.com/author/:name", "regex": "...",, "examples": ["https://example.com/author/john-smith", "https://example.com/author/sally-green"] }


The simplified HTML containing only text and <a> tags is:
{{htmls}}

The base URL from which you start is:
{{urls}}

Focus on URLs relevant the user prompt below:
{{prompt}}
`);
