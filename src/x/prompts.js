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
- Return ONLY JSONL. Your response will be machine parsed using JSON.parse() on a line-by-line basis, splitting in \\n
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
- "example": A JSON example of this item FROM THIS PAGE, do NOT include any data that is not available on this page
- "schema": A dictionary showing the schema of this item. May have nested dictionaries/arrays. Must exactly match the example
- "perPage": Either "single" if there is one of these item per page, or "multiple" if there is multiple of these items per page

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
- Return ONLY JSONL, no commentary. Your response will be machine parsed by JSON.parse() splitting on \\n
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
- Return ONLY JSONL, no commentary. Your response will be machine parsed by JSON.parse() splitting on \\n
`);

export const plan = new Template(
  ['url', 'prompt', 'kb'],
  `You are planning a scrape of a website. You will receive a starting URL, a user prompt, and knowledge about the site layout. Your goal is plan out steps for this scrape. Steps are executd sequentially, in a workflow.

The scrape should start a the initial URL. From there, it can do zero, one, or more iterations of following links. Then, it can extract data from the pages it finds.

More information about finding links:
- Link finders are tied to a specific URL pattern
- You can have more than one link finder per URL pattern
- Start at the first URL
- Follow links based on the site layout, looking for specific URL patterns

More information about extracting data:
- Data extractors are tied to a URL patterns
- You can have more than one data extractor per URL pattern
- Data extractors take in the page HTML, and output structurd data in the form of a JSON object
- Data extractors also pick a field that uniquely identifies the JSON they found. This field is used to combine data across multiple pages.

Your output will consist of JSONL steps, with JSON objects matchin one of the two formats below:

JSON definition for finding links:
- "type": this is "findLinks"
- "filterType": either "ai" or "regex"
  - if filterType is "ai", this link finder will use an AI prompt to find links on this pages. This is useful if the links we need to find do *not* follow a particular pattern or regex, for example they could be across multiple domains, or several kinds of pages on one domains
  - if filterType is "regex", this link finder will use a regex to find links on this page. The regex will match the full, absolute URL
- "prompt": for "ai" link finders, this is the prompt we will use to match outbound URLs
- "linkRegex": for "regex" link finders, this is the regex we will use to match outbound URLs

Example link finders:
{"type": "findLinks", "filterType": "ai", "prompt": "find links to books" }
{"type": "findLinks", "filterType": "regex", "linkRegex": "https://github\\.com/([^/?#]+)$" }

JSON definition for extracting data:
- "type": this is "extract"
- "perPage": either "single" to find one item per page, or "multiple" to find multiple items per page
- "schema": A JSON definition of the schema for data to extract. May contain nested objects or arrays
- "uniqueId": The field in the schema which uniquely identifies this object, and can be used as a key for merging data

Example extractors:
{ "type": "extract", "perPage": "single", "schema": { "title": "Title of the book", "author": "Author of the book", "reviews": [ { "reviewer": "Name of the reviewer", "stars": "Number of stars, X.X / 5", "body": "Text of the review" }, "uniqueId": "title" }
{ "type": "extract", "perPage": "multiple", "schema": { "username": "Username of the commenter", "points": "Number of points the comment received", "timestamp": "Time that the comment was posted, in standard ISO format", "text": "Text content of the review", "commentId": "ID of the comment" }, "uniqueId": "commentId" }

Generate a plan for the prompt and input below:

Knowledge base about site layout:
{{kb}}

Starting URL:
{{url}}

User prompt:
{{prompt}}

Follow these important rules:
- Return ONLY JSONL, no commentary. Your response will be machine parsed by JSON.parse() splitting on \\n
- Your response MUST be VALID JSONL
`);

export const nextStep = new Template(
  ['url', 'text', 'steps', 'prompt', 'kb'],
  `You are planning a scrape of a website. You will receive a starting URL, a user prompt, and knowledge about the site layout. You will also receive the steps executed so far. Your goal is to figure what next step should be taken, if any, to complete the scrape. Suggest steps and stop when the scrape is done, or down a wrong step.

You will use one of the following functions in the next step.

- findLinks(prompt): Look for links on the current page matching "prompt". An AI LLM is used to execute this step. Call this step if the current page links to relevant pages.
- extractData(jsonSchema): Extract data from the current page in the format "jsonSchema". May have nested objects or array. An AI LLM is used to execute this step. Call this step if there is relevant data to extract on the current page, AND we have not yet extracted data this type of page/data
- abort(): end the scrape because we are down a wrong path that is unlikely to give the item we need
- success(): end the scrape because we have figured out a set of steps that will give the needed data. Return this when there is at least one extractData steps, and the sample data it returns looks like it satisfies the user prompt

For any of these, give an "intent" field that explains the intent of this step

Give your response in JSON format, like this:

{"intent": "...intent of this step...", "start": ["https://example.com/a", "https://example.com/b"]}
{"intent": "...intent of this step...", "findLinks": "Find links to books"}
{"intent": "...intent of this step...", "findLinks": "Find links to comments about this book"}
{"intent": "...intent of this step...", "extractData": {"username": "username of the commenter", "timestamp": "ISO timestamp of the comment"}}
{"intent": "...intent of this step...", "abort": true}
{"intent": "...intent of this step...", "success": true}

Guidelines:
- Steps are executed in sequence
- You already have some steps executed
- Your goal is to figure out the NEXT step

Generate a plan for the prompt and input below:

Knowledge base about site layout:
{{kb}}

Current page URL:
{{url}}

Current page text:
{{text}}

User prompt:
{{prompt}}

Step history so far:
{{steps}}

Notes:
- Your next step will be executed on the CURRENT page
- Look at the step history so far to avoid redundancy and pointless loops
- There are a few other scrapers running on the same task, trying different approaches. If it seems like you are down a wrong path, simply stop
- But if you are on a good path, continue

Given the above, what is the NEXT step the user should take? Respond in JSON format.

Follow these important rules:
- Return ONLY JSON, no commentary. Your response will be machine parsed by JSON.parse() splitting on \\n
- Your response MUST be VALID JSON
`);

export const crawl = new Template(
  ['url', 'text', 'links', 'prompt', 'kb'],
  `You are crawling a website as part of a web scraper. You are looking for pages that will have items the user is looking for. The user prompt is below.

You will return URLs that are helpful to this crawl. URLs can be helpful in one of two ways. First, they are helpful if they contain the item the user is looking to scrape. Second, they are helpful if they will link to pages that contain the item the user is looking for.

Return a JSONL list of URLs that are helpful, with the following fields:

- "url": the exact full absolute URL that is helpful
- "ratingHasItem": a rating from 1 to 100 of how likely this URL is to have items matching the user prompt
- "ratingHasLinks": a rating from 1 to 100 of how likely this URL is to link to other helpful pages

Examples of valid output:

{"url": "https://example.com/page/1", "ratingHasItem": 20, "ratingHasLinks": 85}
{"url": "https://example.com/item/xyz-abc", "ratingHasItem": 90, "ratingHasLinks": 30}

Knowledge base about site layout:
{{kb}}

Current page URL:
{{url}}

Current page text:
{{text}}

Current page links:
{{links}}

User prompt:
{{prompt}}

Notes:
- You should NOT return every URL. Only return ones that are helpful, either because they have the items matching the prompt, or they are likely to link to helpful pages

Follow these important rules:
- Return ONLY JSONL, no commentary.
- Your response will be machine parsed by JSON.parse() splitting on \\n
`);
