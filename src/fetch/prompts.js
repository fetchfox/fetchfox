import { Template } from '../template/Template.js';

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
      "candidateAction": "The action to perform. Either 'click', 'scroll', or 'click-scroll'",
      "optionalAction": "Return 'yes' if this action should be considered optional",
      "candidatePlaywrightSelector": "If action is 'click' or 'click-scroll', give CSS selector for this candidate function",
      "candidateScrollType": "If action is 'scroll' or 'click-scroll', this is either 'page-down' or 'bottom'"
    },
    {
      "candidateAnalysis": "Reason for why this one might work",
      "candidateAction": "The action to perform. Either 'click', 'scroll', or 'click-scroll'",
      "candidatePlaywrightSelector": "If action is 'click' or 'click-scroll', give CSS selector for this candidate function",
      "candidateScrollType": "If action is 'scroll' or 'click-scroll', this is either 'page-down' or 'bottom'"
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
- "candidateAction": One of "click", "scroll" or "click-scroll"
  - "click" if you need to click an element
  - "scroll" if you need to scroll on the page
  - "click-scroll" if you need to focus on a specic element, and *then* scroll
- "optionalAction": Some actions are optional. A typical example is accepting cookies or other terms of service: if these fail, it's not important and we should continue. If the user prompt indicates the action is optional, follow that guidance. Return "yes" for optional actions, and "no" for required ones.
- "candidatePlaywrightSelector": If action is "click" or "click-scroll", give the selector for the item to click to achieve the goal. You can do either "css=..." for css selector, or "text=..." for text base selector. This will be used in Playwright.
- "candidateScrollType": If action is "scroll" or "click-scroll", return either "page-down" or "bottom"
  - "page-down" to scroll down a window height using the page down button
  - "bottom" to scroll all the way to the bottom using javascript

>>>> Analyze this HTML:
{{html}}

>>>> Remember, your goal is this:
{{command}}

Follow these important rules:
- Ensure that the action is appropriate for the page context and can be reused for multiple pages if necessary.
- Avoid hardcoding specific text or values when possible. Instead, try to generalize the command to make it reusable across different pages.
- If no action is needed, or if you can't find a way to do it, return empty list for candidates
- You might need one or two commands to complete action, maybe three, but usually not that many

REMEMBER:
- Each candidate is a distinct possible way to achieve the goal. They are NOT related to each other.
- Do *NOT* guess at CSS selectors that may exist. ONLY incldue ones you see in the portion of the page you are lookin at
- Keep the CSS selectors as SIMPLE as possible and human understandable
- If you are matching text, you must use "text=...". Do NOT try to use CSS to match text. Playwright can do both, but you must use text= for text matching.

IMPORTANT:
- Do NOT use ":contains(...)" pseudo selector for any css= selectors
- Do NOT invent CSS selectors to match text. NEVER MATCH TEXT WITH css=...
- You MUST prefix css= or text= to your CSS selectors
- ALWAYS USE VALID CSS SYNTAX

Respond ONLY in JSON, with no explanation. Your response will be machine consumed by JSON.parse() splitting in \\n
`);

export const checkAction = new Template(
  ['action', 'goal', 'iterations', 'domainSpecific'],
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

{{domainSpecific}}

Respond ONLY with JSON. Your response will be machine parsed with JSON.parse()`);
