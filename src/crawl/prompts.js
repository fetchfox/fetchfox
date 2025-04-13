import { Template } from '../template/Template.js';

export const gather = new Template(
  ['query', 'url', 'body'],
  `You are part of a web crawling program, and your goal is to pick out relevant links in a list. The list contains the inner text of links, and also their URLs. You will take this list, look for links that match the user prompt, and generate a new list of only the matching items.

Your response will be ONLY a "url" field of matching items.

Example of valid output:

{ "url": "https://www.exampel.com/category/page-1" }
{ "url": "https://www.exampel.com/category/page-5" }
{ "url": "https://www.exampel.com/category/page-13" }

You are looking for URLs in the page body below:
{{body}}

The current URL is:
{{url}}

Find links matching the user query, which is:
{{query}}


Follow these important rules:
- The entire array should be JSONL, with a single object per link
- Do not wrap the response in an array, return individual dictionaries only per-line.
- Do not include any markdown formatting. Only include JSONL.
- Generally avoid links with no link text.
- Respect user filter requests, if any
- Often, but not always, the links you match will follow a similar pattern. If you notice that a handful match a similar pattern, the rest likely will too.
- Return ONLY full, absolute URLs

`);

export const rate = new Template(
  ['query', 'links'],
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
  ['urls'],
  `You are given a list of URLs, and your goal is to create rules for categorizing them. You will return the following:

- "categoryName": The name of this URL category
- "urlPattern": The URL pattern, with parameters indicated in :parameter format
- "regex": A regex for matching this URL pattern. This regex should be a STRING that can be parsed by Javascript new RegExp();

You should return under a dozen categories, and may exclude some URLs if they do not fit with the general pattern of categories.

Example of valid output:

{"categoryName": "article", "urlPattern": "https://example.com/article/:date/:id", "regex": "https:\\/\\/example.com\\/article\\/[0-9]{4}-[0-9]{2}-[0-9]{2}/[a-f0-9]+"}
{"categoryName": "author", "urlPattern": "https://example.com/author/:name", "regex": "https:\\/\\/example.com\\/author\\/[a-z\\-]+"}

Follow these important rules:
- The entire array should be JSONL, with a single object per link
- Do not wrap the response in an array, return individual dictionaries only per-line.
- Do not include any markdown formatting. Only include JSONL.

The list of URLs to categorize is below:
{{urls}}
`,
);

export const score = new Template(
  ['html', 'questions'],
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

export const rank = new Template(
  ['urls', 'counts', 'pattern'],
  `You are are crawling a site to find URLs that match a pattern. You will decide the next URLs to visit. Give the URLs most likely to have results that match the pattern.

To help, you will also have some previous data of matches on URLs you already visited.

>>> Here are the matches for previous URLs you visited:
{{counts}}

>>> Decided which of these URLs you should visit next:
{{urls}}

>>> The crawl is looking for URLs that match this pattern:
{{pattern}}

Give results in JSONL format. Each JSON object you return should have these fields:

- "analyis": 10-20 words about why you think this is a good URL to visit
- "ratingIndirectLinks": Rating from 1..100 of how likely this URL is to have an indirect path to the target pattern
- "ratingDirectLinks": Rating from 1..100 of how likely this URL is to have a direct path to the target pattern
- "rating": Rating from 1..100 of priority for visiting this URL, based on the likelihood of direct or indirect links
- "url": The URL itself

Examples of valid output:

  {"analyis": "This URL has xyz in it, and previous URLs with that have given many results", "rating": 80, "url": "https://example.com/xyz/page-1/abc"}

Follow these important rules:
- Return ONLY results from the input URLs, do NOT invent new URLs
- If there are not enough input URLs, return as many as you can
- Give the best matches first

Tips:
- Sitemap and listing pages have a good chance of providing indirect links.

Respond ONLY in JSONL, with one valid JSON object per line, your response will be machine parsed using JSON.parse(), splitting on \n
`);

export const urlPatterns = new Template(
  ['layout'],
  `Given the following site layout, return a list of URL matchers.

The site layout shows the parent URL and the sub URLs it links to, with indentation indicating the depth.

You should return URL matchers as JSONL, with each JSON object having two fields:

- "name": name of the pattern, in dash-case, typically 2-30 characters
- "pattern": url pattern, in a format like https://www.example.com/category/:id/sub/:sub-id
- "regex": a regex to match this pattern. must be compatible with Javascript's new RegExp();

They layout is below:

{{layout}}

This layout already includes some patterns, which are collapsed. Use these existing patterns, or improve upon them, or consolidate into them, as you see fit.

Keep in mind these guidlines:

- Generally group similar content to one matcher
- One-off urls can be ignored
- Prefer to give patterns + regexes
- Give a matcher for the root URL as 'root'
- If you see many repeated similar URLs with a common path component, those are a good candidate for a matcher

IMPORANT point on ordering:
- Give more specific matchers BEFORE more general ones, for example https://example.com/a/:id/:sub-id goes BEFORE https://example.com/a/:id
- Give as many matchers a necessary to cover all groupable URLs
- Make sure to repeat any matchers you want to keep from the original layout

WARNING top level catch-all matchers:
- Sometimes, you may need to give a generic top level matcher like https://example.com/:id or https://example.com/:username/:id
- These will often overmatch, so always place them last
- And if you include these, first pull out content pages like https://example.com/something or https://example.com/other-thing that likely override the generic matcher
- Generally, if https://example.com/something/:id exists, there is usually also a matcher for https://example.com/something that should override the catch-all of https://example.com/:id

Repeated similar URLs:

Your response will be machine parsed using JSON.parse(), splitting on '\n'. Therefore, respond ONLY with valid JSONL
`);
