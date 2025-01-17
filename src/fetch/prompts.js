import { Template } from "../template/Template.js";

export const analyzePagination = new Template(
  ["html", "domainSpecific"],
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
- Make sure your paginationJavascript is re-usable for multilple iterations. Do NOT hardode references to specific pages numbers, specific URLs that only work on the first page
- Make your code robust, and do not paginate if it is not possible
- If the page has pagination, you must always include paginationJavascript
- Keep CSS selectors simple as possible

{{domainSpecific}}

IMPORTANT:
- "paginationJavascript"  will be a parameter to new Function(). Therefore, do NOT give a function signature.

>>>> Analyze this HTML:
{{html}}

Respond ONLY in JSON, with no explanation. Your response will be machine consumed by JSON.parse()
`,
);
