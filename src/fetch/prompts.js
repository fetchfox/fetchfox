import { Template } from '../template/Template.js';

export const paginationAction = new Template(
  ['html', 'domainSpecific'],
  `You are part of a web scraping program. You are given some HTML, and your goal is to analyze the pagination style of this page.

Response with JSON as follows:

{
  \`paginationAnalysis\`: \`string...\`,
  \`paginationCommand\`: \`string...\`,
  \`paginationArgument\`: \`string...\`
}

- "paginationAnalysis": 10-30 word english desrption of how to paginate to the NEXT page page. If no pagination, say so.
- "paginationElementCss": "css selector of the next page button, if one exists. null otherwise",
- "paginationElementText": "text of the next page button, which will be used for an xpath selector",
- "paginationCommand": If the page has pagination, this will be one these: "click", "scroll", or "evaluate"
  - "click" if you need click a button or link to go to the next page
  - "scroll" if you need to scroll down to paginate
  - "evaluate" if clicking or scrolling doesn't work, and instead you need to execute some more complex javascript to paginate. Prefer click or scroll
- "paginationArgument": the value depends on the command
  - if command is "click", the text or CSS selector of the next page button. prepend "text=" or "css="
  - if command is "scroll", how much to scroll: either "window" for window height, or "bottom" to scroll all the way to the bottom1
  - if command is "evaluate", give javascript that will paginate. This javascript will be a parameter to new Function(). Therefore, do NOT give a function signature.

Follow these important rules:
- Make sure your pagination command and argument is reusable for more pages. For example, if you see buttons for page 2, 3, 4, 5, etc.. and a "Next Page" button, make sure to click the next page button.
- Avoird hardcoding href references to specific URLs, instead find a way to go to the next page
- CSS selectors *must* be compatible with document.querySelector(). This means, for exampple, you cannot use :contains()
- KEEP IT SIMPLE, especially avoid overly long and weird CSS selectors. Return null as needed.

{{domainSpecific}}

>>>> Analyze this HTML:
{{html}}

Respond ONLY in JSON, with no explanation. Your response will be machine consumed by JSON.parse()
`);
