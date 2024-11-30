import { Template } from '../template/Template.js';


export const analyzePagination = new Template(
  ['html'],
  `You are part of a web scraping program. You are given some HTML, and your goal is to analyze the pagination style of this page.

Response with JSON as follows:

{
  "hasPagination": boolean
  "paginationAnalysis": string,
  "paginationStyle": null or string,
  "paginationSelector": null or string,
  "paginationJavascript": null or string,
}

Each field should be filled as follows:

- "hasPagination": true or false
- "paginationAnalysis": 10-30 word english description of pagination setup on this page
- "paginationStyle": One of these: "pageNumberUrl", "nextPageUrl", "pageNumberButton", "nextPageButton", "scroll"
- "paginationSelector": CSS selector that picks out the pagination component on the page. Can be null if none is applicable, for exmple with infinite scrolling pagination
- "paginationJavascript": Javascript code that can be executed on the page to go to the next page

Follow these important rules:
- Make sure your paginationJavascript is re-usable for multilple iterations, so do not hard code a specific URL
- If the page has pagination, you must always include paginationJavascript
- Keep CSS selectors simple as possible

>>>> Analyze this HTML:
{{html}}

Respond ONLY in JSON, with no explanation. Your response will be machine consumed by JSON.parse()
`);


export const pages = new Template(
  ['links'],
  `You have a list of URLs and their link texts. Return JSONL (line by line) of ONLY the ones that are pagination links. Pagination links are ones that link to additiional pages of data on the same topic as this page.

>>>> Links to filter for pagination links:
{{links}}
`);

export const pages_old = new Template(
  ['links', 'questions'],
  `You have a list of URLs and their link texts. Return JSONL (line by line) of ONLY the ones that are pagination links relted to these questions. Pagination links are ones that link to additiional pages of results related to the user questions.

Do NOT return links to individual items, only pagination links.

Return results in order of page and relevance.

>>>> Questions:
{{questions}}

>>>> Links to filter:
{{links}}
`);
