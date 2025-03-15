import { Template } from '../template/Template.js';

export const pageAction = new Template(
  ['html', 'command', 'hint'],
  `You are part of an elite web scraping program. You are given some HTML and a goal.

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
      "candidateScrollType": "If action is 'scroll' or 'click-scroll', this is either 'page-down' or 'bottom'",
      "candidateConfidence": "number in range 1..100"
    },
    {
      "candidateAnalysis": "Reason for why this one might work",
      "candidateAction": "The action to perform. Either 'click', 'scroll', or 'click-scroll'",
      "candidatePlaywrightSelector": "If action is 'click' or 'click-scroll', give CSS selector for this candidate function",
      "candidateScrollType": "If action is 'scroll' or 'click-scroll', this is either 'page-down' or 'bottom'",
      "candidateConfidence": "number in range 1..100"
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
  - "click-scroll" if you need to focus on a specific element, and *then* scroll
- "optionalAction": Some actions are optional. A typical example is accepting cookies or other terms of service: if these fail, it's not important and we should continue. If the user prompt indicates the action is optional, follow that guidance. Return "yes" for optional actions, and "no" for required ones.
- "candidatePlaywrightSelector": If action is "click" or "click-scroll", give the selector for the item to click to achieve the goal. You can do either "css=..." for css selector, or "text=..." for text base selector. This will be used in Playwright.
- "candidateScrollType": If action is "scroll" or "click-scroll", return either "page-down" or "bottom"
  - "page-down" to scroll down a window height using the page down button
  - "bottom" to scroll all the way to the bottom using javascript
- "candidateConfidence": A rating from 1-100 of how confident you are that this is the right action

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
- Do *NOT* guess at text or CSS selectors that may exist. ONLY include ones you see in the portion of the page you are looking at
- Keep the CSS selectors as SIMPLE as possible and human understandable
- If you are matching text to select an element from the page, you must use "text=...". Do NOT try to use CSS to match text. Playwright can do both, but you must use text= for text matching.

IMPORTANT:
- Do NOT use ":contains(...)" pseudo selector for any css= selectors
- Do NOT invent CSS selectors to match text. NEVER MATCH TEXT WITH css=...
- Use valid CSS syntax
- You MUST prefix css= or text= to your CSS selectors
- Do not combine css= and text=, use only one of them
- Prefer CSS selectors when possible

Limit:
- Do not give candidates if the action is unecessary or cannot be done

{{hint}}

Respond ONLY in JSON, with no explanation. Your response will be machine consumed by JSON.parse() splitting in \\n
`);

export const checkAction = new Template(
  ['action', 'goal', 'iterations', 'domainSpecific'],
  `You are part of a web scraping program. The browser has just taken an action basd on a user prompt. You have the before and after state of the browser. Your goal is to determine if that action was properly executed. Respond in JSON format, as follows:

Fields:
- "analysis": Your analysis of the goal, the before state, the after state, and how you understand the situation. 10-50 words. Remember, for an actions that repeat, only a SINGLE iteration was executed. If your analysis shows that the action was a success, we will thereafter complete the later iterations.
- "didComplete": The string "yes" if that action was completed for one good iteration, or "no" if the action was not completed

Below is the user input:

{{iterations}}

>>>> The following action was taken, expressed in a machine readable format:
{{action}}

>>>> The user prompt for actions is:
{{goal}}

{{domainSpecific}}

Respond ONLY with JSON. Your response will be machine parsed with JSON.parse()`);

export const checkScroll = new Template(
  ['before', 'after'],
  `You are part of a web scraping program. You are testing if scrolling down is a way to paginate to load more results on a page. You have the before and after state of the page. The before state is text/html from before scrolling down, and the after state is text/html is afterwards.

Pagination worked if new, different results loaded on the page. Focus on the main content of the page. Do you see new, different results? The previous results may or may not still be there, but there should be new different results in the after HTML.

>>> The state of the page from BEFORE scrolling:
{{before}}

>>> The state of the page from AFTER scrolling:
{{after}}

Return with JSON that has the following fields:

- "analysis": A ~20-60 word analysis of the situation as it relates to whether pagination worked. In your analysis, say if new content was loaded, and if so, the location of the new content (main content or side widgets)
- "didPaginate": Either "yes" or "no". "yes" means new different results loaded in the main content, and pagination was successful. "no" means no new results in main content. If only side widgets loaded content, make sure to say "no"

Example valid responses:

{
  "analysis": "the page has shopping results, and the after HTML has new results that are different, and it was in the main content area",
  "didPaginate": "yes"
}

{
  "analysis": "the page has news articles, and the after HTML is different, but there are no new news articles. Only a small widget changed, seemingly unrelated to scrolling or the main content",
  "didPaginate": "no"
}

Return ONLY JSON, your response will be machine parsed using JSON.parse()
`);

export const pageActionCode = new Template(
  ['html', 'command', 'limit', 'timeout', 'hint'],
  `You are part of an elite web scraping program. You are given some HTML and a goal.

Response with Javascript code that accomplishes this goal.

The Javascript code will have the parameters available:

* page: a Playwright page object
* fnSendHtml: a function to send the current page's HTML for evaluation. Call this whenever you have completed an iteration towards the goal. This is an async function, and you MUST await its results. If it return false, then abort. If it returns true, then continue.
* fnDebugLog: a function to log helpful debug output, use this to explain what is going on
* done: call this when the function is done

>>> The page HTML is:
{{html}}

>>> Your goal is:
{{command}}

{{hint}}
>>> Your must perform the action up to {{limit}} times


BEFORE writing code:
* Write comments about your approach
* Use these sections:
  * Goal (10-20 words): Summarize the goal in your own words
  * Relevance (20-30 words): Is this goal feasible and relvent given the HTML?
  * Selector analysis (10-100 words): Which relevant selectors exist on the page, and how do they relate to the task at hand? If none exist, say so. Do not suggest selectors that don't exist on the page.

AFTER writing code:
* Give a comment line in exactly this format:

// Confidence: 0..100

This is your confidence level that the code will work and is correct given the goal. 0 =low confidence, 100=very high confidence

IMPORTANT RESPONSE FORMATING DIRECTIONS:

Your response will be exactly copied into "new Function(...)" like this:

    const func = new Function("page", "fnSendHtml", "fnDebugLog", "done" "... your response here ");

Therefore:

* You MUST respond with ONLY Javascript code
* Your COMMENTS must be preceded by // on EACH LINE to avoid parsing errors
* Do NOT give \`\`\`javascript formatting in your response
* Do NOT give ANY function signature, jump straight into code
* The parameters will be made available using the new Function(...) constructor

Important guidelines:
* Your code will be used on the page HTML above, and similar pages
* Do NOT guess at selectors you don't see on the page
* If the action seems impossible, or not relevant, just write a noop function that calls done() right away
* Do not waste time trying to click selectors that don't exist
* Write robust code. If selectors timeout or fail, catch the error and try to continue

>>>> Use a timeout of {{timeout}} milliseconds when waiting for locators

Iterating over matched elements:
- Do NOT nth(i) for iterating
- Instead, if you need to iterate and do something for a number of elmeents, se locator.evaluateAll(), like this:

    await locator.evaluateAll((elements) => {
      elements.forEach(element => {
        // Do something with each element.
        element.click();
        console.log(element.textContent);
      });
    });

Again, the goal is:
{{command}}

Remember, your robust javascript code will be directly passed into new Function(...);
`);

export const evaluateFn = new Template(
  ['before', 'after', 'code', 'command'],
  `You have just executed some code in Playwright, with the purpose of achieving a goal. Evaluate whether the code executed achieved the goal, based on the before HTML, after HTML, and the code.

>>> HTML before the code:
{{before}}

>>> HTML after the code:
{{after}}

>>> The code exeuted:
{{code}}

>>> The goal was:
{{command}}

Give your response in JSON format, with the following fields:

- "analysis": analyze the situation, include how you will decide if the goal is achieved. Decide if the goal is even possible, and what differences you'll look for before/after. 10-100 words
- "rating": on a scale of 0 to 100, was the goal achieved? 0 = completely failed, 100 = perfect success. If the goal was not possible or optional, that counts as a high scores
- "feedback": give some feedabck on how to improve the code. 10-100 words

Your response will be machine parsed, so respond ONLY with valid JSON that can fed into JSON.parse()`);
