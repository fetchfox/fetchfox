import { Template } from '../template/Template.js';


export const analyzePagination = new Template(
  ['html', 'domainSpecific'],
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
- "paginationSelector": CSS selector that picks out the pagination component on the page. Can be null if none is applicable, for example with infinite scrolling pagination
- "paginationJavascript": Javascript code that can be executed on the page to go to the next page

Follow these important rules:
- Make sure your paginationJavascript is re-usable for multiple iterations. Do NOT hardcode references to specific pages numbers, specific URLs that only work on the first page
- Make your code robust, and do not paginate if it is not possible
- If the page has pagination, you must always include paginationJavascript
- Keep CSS selectors simple as possible
- If the pagination style is "infinite scroll", attempt to paginate by scrolling down the page.

{{domainSpecific}}

IMPORTANT:
- "paginationJavascript"  will be a parameter to new Function(). Therefore, do NOT give a function signature.

>>>> Analyze this HTML:
{{html}}

Respond ONLY in JSON, with no explanation. A complex program will complete fail if you do not respond in JSON. Your response will be machine consumed by JSON.parse()
`.trim()
);

export const verifyPaginationByHTML = new Template(
  ['diff'],
  `You are part of a web scraping program. You are given two HTML snapshots: before and after attempting pagination.

  The diff shows which lines were added ("+"), removed ("-"), or unchanged. If pagination was successful, we expect the diff to reveal:
  - Newly added items (e.g., more <div class="item"> elements, or any additional repetitive elements).
  - Changes in pagination indicators (e.g., a different page number highlighted, a newly enabled "Next" button, or text indicating a new set of results).
  - Any meaningful new content that suggests the page advanced to show more or different results.

  If the diff shows multiple new lines with items, new pagination controls, or any indication that the content set changed or grew, then pagination likely occurred.

  If the diff shows no meaningful additions (no new items, no changed pagination indicators), or if all changes are insignificant or unrelated to showing more/different content, then pagination likely failed.

  Respond ONLY in JSON, in the following structure:

{
  "paginationOccurred": boolean,
  "reason": string
}

  - "paginationOccurred": true if the diff indicates new or changed content suggesting pagination.
  - "paginationOccurred": false if no meaningful new content or pagination changes are evident.
  - "reason": a short, one-sentence explanation referencing the nature of the changes or lack thereof.

  No extra commentary, just JSON.

>>>> DIFF:
{{diff}}
`.trim()
);

export const verifyPaginationByURL = new Template(
  ['beforeURL', 'afterURL'],
  `You are part of a web scraping program. You are given two URLs: before and after attempting pagination.

  Your task: Determine if the change in URLs clearly indicates that pagination has occurred. For example:

  - If the afterUrl has a query parameter or path indicating a next page (e.g. from "https://example.com?page=1" to "https://example.com?page=2").
  - If the path structure changes from something like "/page/1" to "/page/2".
  - Any clear numerical increment in the page indication within the URL.

  If the afterUrl strongly suggests moving to another page of results (e.g., an incrementing page number or similar), then pagination likely occurred.

  If the afterUrl does not differ in a way that suggests a next page (e.g. it's identical or changes unrelated to pagination), then pagination likely did not occur.

  Respond ONLY in JSON:

  {
    "paginationOccurred": boolean,
    "reason": string
  }

  - "paginationOccurred": true if the afterUrl indicates a new page of results, otherwise false.
  - "reason": a short sentence explaining why you determined true or false.

  No extra commentary. The entire response must be valid JSON.

  >>>> BEFORE URL:
  {{beforeURL}}

  >>>> AFTER URL:
  {{afterURL}}
`.trim()
);