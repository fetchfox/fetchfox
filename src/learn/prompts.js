import { Template } from '../template/Template.js';

export const availableItems = new Template(
  ['urls', 'htmls', 'prompt'],
  `You are part of a web scraping program, and you are analyzing a set of pages for available data to scrape. Your goal is to see what information on the page could be turned into structured data. The pages are expected to be similar.

You should return a list of JSON objects in JSONL format, where each object has the following fields

Additionally, focus on items relevant to the user prompt.

- "item": 1-5 word description of the item that is available to scrape
- "example": A JSON example of this item FROM THIS PAGE. Do NOT nest arrays or dictionaries. Do NOT include any data that is not available on this page
- "template": A dictionary showing the template of this item. Do NOT nest arrays or dictionaries. All values must be strings. Must exactly match the example
- "perPage": Either "single" if there is one of these item per page, or "multiple" if there is multiple of these items per page

Examples of valid output:

{"item": "book", "example": {"title": "1984", "author": "George Orwell", "rating": 4.5, "url": "https://example.com/page" }, "template": { "title": "Title of the book", "author": "Author of the book", "rating": "Rating out of 5 for the book", "url" : "URL of the book details. Full absolute URL" } }
{"item": "comment", "example": {"username": "Bob", "points": 120, "timestamp": "Jan 1, 2025 12:45pm", "text": "...", "url": "https://example.com/page"}, "template": { "username": "Username of the commenter", "points": "Number of points the comment received", "timestamp": "Time that the comment was posted", "text": "Text content of the review", "url": "URL of the comment permalink. Full absolute URL" } }


URLs of the pages:
{{urls}}

HTML samples of the page:
{{htmls}}

Focus on item relevant the user prompt below. However, do not be overly restricted. If there are items somewhat related, feel free to suggest those also. Give the most relevant suggestions first.

>>> User prompt:
{{prompt}}

Guidlines:
- Ignore general categories like "site navigation" or "site links", focus on content and data unique to this page and domain
- Return data that is on *this page*, not data that is linked from it

Include 2-4 items typically:
- Identify the 2-4 different kinds of items being scraped
- Suggest items based on the user prompt, and the main point of the page
- If there are URLs in the items, they must link to different types of pages

Combined item data:
- Keep related data COMBINED. For example, a book has an author, a title, and a price. Do NOT give 3 items in that case. Give only one, with those 3 properties

"url_*" fields:
- If possible and appropriate, include fields named "url_something" that links to more details about this item. Include this if there is a URL you can follow
- These fields MUST start with "url_"
- You may have 0, 1, 2, or more of these, as appropriate. For example a article submission on reddit might have "url_article", "url_comment_thread", and "url_submitter" for the various associated URLs
- All URLs should be full, absolute URLs
- Do NOT give the same URL as the current page. Do NOT include it if the only URL you can think of is the current page.

Follow these important rules:
- Provide a SINGLE result for the multiple page samples you give. Look for COMMONALITIES between the pages.
- Your response MUST be VALID JSONL
- Each object must be a SINGLE link of JSON. Do NOT break JSON objects into multiple lines under any circumstances
`);


export const availableLinks = new Template(
  ['links', 'urls', 'prompt'],
  `You are given a simplified HTML that inludes text and <a> tags. Your goal is to create rules for categorizing them links. You will return a list of URL patterns in JSONL format. URLs patterns precede parameters in the URLs with ":", and they can be used to match URLs and categorize them. The parameters describe what they typically contain: an ID, a name, a date, a username, etc.

Additionally, try to focus on URLs relevant to the user prompt. Relevant URLs are ones that directly relate to the user prompt, or they can contain indirectly link to the user prompt.

Each JSONL object contains these fields:
- "description": A description of the URL pattern, 4-10 words, plain English
- "relevancy": Describe if and how the URL pattern relates to the user scraping prompt, 4-10 words, plain English
- "noun": A noun that fits into the pharse: "Go to X", for example "Go to listing pages" or "Go to user profiles". Do not include "Go to", only give the X part
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

{"description": "an individual article page", "relevancy": "articles may contain data about gold market", "noun": "articles" "category": "article", "pattern": "https://example.com/article/:date/:id", "regex": "...", "examples": ["https://example.com/article/2024-01-05/4444", "https://example.com/article/2022-05-11/5555"]}
{"description": "an author's profile page", "relevancy": "low relevance, but authors may be experts in gold market", "noun": "author profiles", "category": "author-profile", "pattern": "https://example.com/author/:name", "regex": "...",, "examples": ["https://example.com/author/john-smith", "https://example.com/author/sally-green"] }


Below are all the links for this page:
{{links}}

The base URL from which you start is:
{{urls}}

Focus on URLs relevant the user prompt below:
{{prompt}}

* Give the most salient and most relevant results FIRST
* Focus on content, not navigation or interaction links
* Avoid duplicates
* Typically you should generate 2-4 results
`);


// {"item": "book", "template": { "title": "Title of the book", "author": "Author of the book", "reviews": [ { "reviewer": "Name of the reviewer", "stars": "Number of stars, X.X / 5", "body": "Text of the review" } ], "url" : "URL of the book details. Full absolute URL" } }
// {"item": "comment", "template": { "username": "Username of the commenter", "points": "Number of points the comment received", "timestamp": "Time that the comment was posted, in standard ISO format", "text": "Text content of the review", "url": "URL of the comment permalink. Full absolute URL" } }

