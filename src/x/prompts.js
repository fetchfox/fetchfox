import { Template } from '../template/Template.js';

export const description = new Template(
  ['htmls'],
  `Given the HTML samples below, provide a brief analysis and description of the page. Your response will be in JSON format, with the following fields:

- "description": A description of the page contents and main data it contains. 5-10 words, plain English
- "name": A short name for this type of page, 1-3 words, dash-case

Example:

{
  "description": "This page contains example content about examples",
  "name": "example-page"
}

- Provide a SINGLE result for the multiple page samples you give. Look for COMMONALITIES between the pages.
- Return ONLY JSON. Your response will be machine parsed using JSON.parse()

Pages HTML samples:
{{htmls}}
`);

export const categorize = new Template(
  ['urls', 'prompt'],
  `You are given a list of URLs with their inner text and HTML, and your goal is to create rules for categorizing them. You will return a list of URL patterns in JSONL format. URLs patterns precede parameters in the URLs with ":", and they can be used to match URLs and categorize them. The parameters describe what they typically contain: an ID, a name, a date, a username, etc.

Additionally, try to focus on URLs relevant to the user prompt. Relevant URLs are ones that directly relate to the user prompt, or they can contain indirectly link to the user prompt.

Each JSONL object contains these fields:
- "description": A description of the URL pattern, 4-10 words, plain English
- "relevancy": Describe if and how the URL pattern relates to the user scraping prompt, 4-10 words, plain English
- "category": A category name for the URL pattern, 1-4 words, dash-case
- "pattern": The URL pattern itself, full absolute matcher starting with http:// or https://
- "regex": A regex to match URLs to this pattern, full absolute matcher starting with http:// or https://
- "examples": An array of a few representative examples from the given data

Follow these important rules and guidelines:
- Return ONLY JSONL. Your response will be machine parsed using JSON.parse() on a line-by-line basis, splitting in \n
- Avoid long, overly specific matchers
- Pattern variable names must have ONLY alphabetical characters
- Find ALL the URL patterns you notice. Use contextual and domain knowledge that you have.

Example of valid output:

{"description": "an individual article page", "relevancy": "articles may contain data about gold market", "category": "article", "pattern": "https://example.com/article/:date/:id", "regex": "...", "examples": ["https://example.com/article/2024-01-05/4444", "https://example.com/article/2022-05-11/5555"]}
{"description": "an author's profile page", "relevancy": "low relevance, but authors may be experts in gold market", "category": "author-profile", "pattern": "https://example.com/author/:name", "regex": "...",, "examples": ["https://example.com/author/john-smith", "https://example.com/author/sally-green"] }


The list of URLs with inner text and HTML to categorize is below:
{{urls}}

Focus on URLs relevant the user prompt below:
{{prompt}}
`);

export const availableItems = new Template(
  ['urls', 'htmls', 'prompt'],
  `You are part of a web scraping program, and you are analyzing a set of pages for available data to scrape. Your goal is to see what information on the page could be turned into structured data. The pages are expected to be similar.

You should return a list of JSON objects in JSONL format, where each object has the following fields

Additionally, focus on items relevant to the user prompt. You may IGNORE item types that aren't helpful for the search prompt (below).

- "item": 1-5 word description of the item that is available to scrape
- "schema": A dictionary showing the schema of this item. May have nested dictionaries/arrays

Examples of valid output:

{"item": "book", "schema": { "title": "Title of the book", "author": "Author of the book", "reviews": [ { "reviewer": "Name of the reviewer", "stars": "Number of stars, X.X / 5", "body": "Text of the review" } ] } }
{"item": "comment", "schema": { "username": "Username of the commenter", "points": "Number of points the comment received", "timestamp": "Time that the comment was posted, in standard ISO format", "text": "Text content of the review" } }

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

export const pickRelevant = new Template(
  ['url', 'prompt', 'linksTo'],
  `You are given some data about a website, and a user data extraction prompt. The data about the website includes URL patterns that the website links to. Your goal is to pick out the URL patterns most likely to relate to the user's prompt.

You will return JSONL, one object per line, with these fields:
- "pattern": The URL pattern being analyzed
- "analysis": A 2-5 words analysis of how this URL pattern may relate to the user prompt
- "ratingLinksTo": A rating from 1 to 100 of how likely this URL is to *link to* items for the user prompt
- "ratingDetailsAbout": A rating from 1 to 100 of how likely this URL is to have *details about* the user prompt
- "rating": A relevancy rating from 1 to 100 of how well this URL pattern relates the the prompt

Example of valid output:

{"pattern": "https://example.com/article/:date/:id", "analysis": "articles the user is looking for", "ratingLinksTo": 10, "ratingDetailsAbout": "95", "rating": 90 }
{"pattern": "https://example.com/author/:name", "analysis": "authors may link to articles", "ratingLinksTo": 70, "ratingDetailsAbout": "5",  "rating": 40 }

The website URL is:
{{url}}

The user prompt is:
{{prompt}}

The site data is:
{{linksTo}}

Follow these important rules:
- Return ONLY JSONL, no commentary. Your response will be machine parsed by JSON.parse() splitting on \n
- Give only a handful of relevant responses
`);

export const matchToPatterns = new Template(
  ['patterns', 'urls', 'prompt'],
  `You are given some URL patterns and some URLs. Your goal is to match the URLs to the patterns.

Use your best judgement and contextual awareness to match the URLs. The URLs must match the pattern, but the patterns may overmatch. Exclude overmatches that you notice.

For example, if there is a pattern like https://example.com/:username, and a URL like https://example.com/about-us, the about-us URL should NOT match. That is because it is unlikely to be a username, and very likely to be a static about-us content page.

You should return results line-by-line in JSONL format, with the following fields:

- "pattern": The pattern being matched
- "url": The URL that matches

Follow these important rules and guidelines:
- If a URL in the list does not match any patterns, do NOT return it.
- Return only the most relevant URLs and patterns based the user search prompt below
- Do not match more than 4-6 URLs per pattern

The URLs are:
{{urls}}

The patterns are:
{{patterns}}

The user prompt is:
{{prompt}}

Remember:
- Return ONLY JSONL, no commentary. Your response will be machine parsed by JSON.parse() splitting on \n
`);
