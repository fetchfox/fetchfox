import { Template } from '../template/Template.js';

export const pageAction = new Template(
  ['html', 'command'],
  `You are part of a web scraping program. You are given some HTML and a goal.

Your goal is: {{command}}

Your task is to determine the **most direct action** to achieve the goal **without unnecessary intermediate steps**.

Respond with JSONL, with JSON object in lines as follows:

{ "actionAnalysis": "string...", "actionElementCss": "string...", "actionType": "string...", "actionArgument": "string...", "isPaginationAction": "string..." }

- "actionAnalysis": 10-30 word English description of what action should be taken on the page, or if no action is required.
- "actionElementCss": "css selector of the element that needs interaction, if one exists. null otherwise",
- "actionType": The action to perform:
  - "click" if you need to click on elements, links, or other clickable elements. There can be multiple clickable elements, in which case your selector should match all of them.
  - "scroll" if scrolling is needed to trigger content or reveal a hidden element.
  - "evaluate" if a more complex action requires executing JavaScript directly on the page.
  - "none" if no action is required.
- "actionArgument": The value depends on the command:
  - If command is "click", provide the CSS selector. Use the format:
    - prepend "css=" for matching css selectors
  - If command is "scroll", specify how much to scroll: either "window" (for window height) or "bottom" (for scrolling to the bottom of the page).
  - If command is "evaluate", give JavaScript that will execute to trigger the action. This JavaScript will be a parameter to new Function().
- "isPaginationAction": Answer "yes" if this is an action that does pagination. If you are returning multiple actions for pagination, only return "yes" for the last one that does the pagination. If the action is not the last action doing pagination, or if it is unrelated to pagination, return "no"

Follow these important rules:
- Ensure that the action is appropriate for the page context and can be reused for multiple pages if necessary.
- Avoid hardcoding specific css or values when possible. Instead, try to generalize the command to make it reusable across different pages.
- Keep the CSS selectors as simple and specific as possible, making them compatible with document.querySelector().
- Prefer CSS selectors that are semantic and human intelligible
- Do NOT invent or guess at CSS selectors. If you don't see one that works, return "none"
- If no action is needed, return "none" as the command.
- You might need one or two commands to complete action, maybe three, but usually not that many

IMPORTANT:
- Do NOT use ":contains(...)" pseudo selector for any css= selectors
- If the task is related to pagination, and it's not obvious how to do it, try scrolling to the bottom. This answer will be checked and discarded if it's wrong. Do this if there are no obvious other ways to paginate.


>>>> Analyze this HTML:
{{html}}

>>>> Remember, your goal is this:
{{command}}

Respond ONLY in JSONL, with no explanation. Your response will be machine consumed by JSON.parse() splitting in \\n
`);
