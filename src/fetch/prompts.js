import { Template } from '../template/Template.js';

export const paginationAction = new Template(
  ['html', 'domainSpecific'],
  `You are part of a web scraping program. You are given some HTML, and your goal is to analyze the pagination style of this page.

Response with JSON as follows:

{
  "paginationAnalysis": "string...",
  "paginationCommand": "string...",
  "paginationArgument": "string..."
}

- "paginationAnalysis": 10-30 word english desrption of how to paginate to the NEXT page page. If no pagination, say so.
- "paginationElementCss": "css selector of the next page button, if one exists. null otherwise",
- "paginationElementText": "text of the next page button, which will be used for an xpath selector",
- "paginationCommand": If the page has pagination, this will be one these: "click", "scroll", "click-scroll" or "evaluate"
  - "click" if you need click a button or link to go to the next page
  - "scroll" if you need to scroll down to paginate
  - "click-scroll" if you need to click on a list to focus on it before scrolling
  - "evaluate" if clicking or scrolling doesn't work, and instead you need to execute some more complex javascript to paginate. Prefer click or scroll
- "paginationArgument": the value depends on the command
  - if command is "click", the text or CSS selector of the next page button. prepend "text=" or "css="
  - if command is "scroll", how much to scroll: either "window" for window height, or "bottom" to scroll all the way to the bottom
  - if command is "click-scroll", the text or CSS selector of the list to focus on before scrolling. prepend "text=" or "css=", and how much to scroll: either "window" for window height, or "bottom" to scroll all the way to the bottom. return the two values in an array
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

export const pageAction = new Template(
  ['html', 'command'],
  `You are part of a web scraping program. You are given some HTML and a goal.

Your goal is: {{command}}

Respond with JSON as follows:

{
  "actionAnalysis": "string...",
  "actionMode": "one of 'distinct', 'first', or 'repeat'"
  "candidates": [
    {
      "candidateAnalysis": "Reason for why this one might work",
      "candidateAction": "The action to perform. For now this is always 'click'",
      "candidateCss": "CSS selector for this candidate function"
    },
    {
      "candidateAnalysis": "Reason for why this one might work",
      "candidateAction": "The action to perform. For now this is always 'click'",
      "candidateCss": "CSS selector for this candidate function"
    },
  ]
}

Information on these fields:
- "actionAnalysis": Describe the desired action and your approach in 10-20 words
- "actionMode": One of the following:
  - "distinct": If we should click each distinct element. This is for situations like clicking each link to a profile page or each link to a detail page.
  - "first": If we always execute this action exactly once on an element. This is for situations like accepting a cookie waiver, where you always click it once.
  - "repeat": If we execute on the *same* element, but more and more times. For example, pagination repeats: to get to page 2, you repeat 2 times, to get to page 3 you repeat 3 times, and so on.
- "candidates": A list of 0 or more possible ways to do this action
- "candidateAnalysis": A 10-20 word analysis of this approach
- "candidateAction": For now this is always "click"
- "candidateCss": The CSS selector for the item to click to achieve the goal

Follow these important rules:
- Ensure that the action is appropriate for the page context and can be reused for multiple pages if necessary.
- Avoid hardcoding specific text or values when possible. Instead, try to generalize the command to make it reusable across different pages.
- Keep the CSS selectors as simple and specific as possible, making them compatible with document.querySelector().
- Do NOT invent or guess at CSS selectors. If you don't see one that works, return "none"
- If no action is needed, or if you can't find a way to do it, return empty list for candidates
- You might need one or two commands to complete action, maybe three, but usually not that many

IMPORTANT:
- Do NOT use ":contains(...)" pseudo selector for any css= selectors

>>>> Analyze this HTML:
{{html}}

>>>> Remember, your goal is this:
{{command}}

Respond ONLY in JSON, with no explanation. Your response will be machine consumed by JSON.parse() splitting in \\n
`);

export const checkAction = new Template(
  ['action', 'goal', 'iterations'],
  `You are part of a web scraping program. The browser has just taken an action basd on a user prompt. You have the before and after state of the browser. Your goal is to determine if that action was properly executed. Respond in JSON format, as follows:

Fields:
- "analysis": Your analysis of the goal, the before state, the after state, and how you understand the situation. 10-50 words. Remember, for an actions that repeat, only a SINGLE iteration was executed. If your analysis shows that the action was a success, we will thereafter complet the later iterations.
- "didComplete": The string "yes" if that action was completed for one good iteration, or "no" if the action was not completed

Below is the user input:

{{iterations}}

>>>> The following action was taken, expressed in a machine readable format:
{{action}}

>>>> The user prompt for actions is:
{{goal}}

Respond ONLY with JSON. Your response will be machine parsed with JSON.parse()`);
