import { Template } from '../template/Template.js';

export const pageActionCode = new Template(
  ['html', 'goal', 'timeout', 'wait', 'expected'],
  `You are part of an elite web scraping program. You are given some HTML and a goal.

Response with Javascript code that accomplishes this goal.

The Javascript code will have the parameters available:

* page: a Playwright page object
* fnSendResults(results): a function to send the results for evaluation. The results may be page HTML, JSON extracton, etc.. Call this whenever you have completed an iteration towards the goal. This is an async function, and you MUST await its results. If it return false, then abort. If it returns true, then continue. Always call this at least once at the end, even if not requested.
* fnDebugLog(msg): a function to log helpful debug output, use this to explain what is going on. Send frequent updates, especially before/after interacting with the page. Include specifics whenever possible.
* done: call this when the function is done

>>> The current state is:
{{html}}

>>> Your goal is:
{{goal}}

BEFORE writing code:
* Write comments about your approach
* Use these sections:
  * Goal (10-20 words): Summarize the goal in your own words
  * Relevance (20-30 words): Is this goal feasible and relvent given the HTML?
  * Selector analysis (10-100 words): Which relevant selectors exist on the page, and how do they relate to the task at hand? If none exist, say so. Do not suggest selectors that don't exist on the page.
  * Variable context handling (10-100 words): How will you account for the distinct variable contexts in Playwright, specifically noting which variables are available in evaluate and evaluateAll blocks that execute in the browser context
  * Iteration using locator.evaluateAll() approach: (10-100 words): Desribe how you will always iterate using locator.evaluateAll(), and never using "nth" selectors/locators

AFTER writing code:
* Give a comment line in exactly this format:

// Confidence: 0..100

This is your confidence level that the code will work and is correct given the goal. 0 =low confidence, 100=very high confidence

IMPORTANT RESPONSE FORMATING DIRECTIONS:

Your response will be exactly copied into "new Function(...)" like this:

    const func = new Function("page", "fnSendResults", "fnDebugLog", "done" "... your response here ");

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

Iterating over matched elements:
- Do NOT nth(i) for iterating
- Instead, if you need to iterate and do something for a number of elmeents, se locator.evaluateAll(), like this:

    await locator.evaluateAll((elements) => {
      elements.forEach(element => {
        // Do something with each element, like click it...
        element.click();
      });
    });

Variable context:
- Recall that Playwright like evaluateAll() and evaluate() have their own execution context, sine they execute inside the Chrome instance. Therefore, fnSendResults and fnDebugLog are not available inside the functions passed to evaluateAll(), evaluate(), etc.

Selector guidance:
- Prefer CSS selectors, but use text= when necessary
- Do NOT mix text= and css= selectors. Choose one or the other
- Do NOT use has-text() selectors for css=
- Do NOT use any pseudo selectors for css=
- Surprisingly, you cannot use numbers IDs as selectors. For example, css=input#0 is an invalid selector, because of the number ID. If you see this, use a different selector instead.

>>> The user requested a timeout the following timeout for selectors and actions:
{{timeout}} milliseconds
Generally follow this timeout, but adjust a little if needed

>>> Wait the following amount of time for page load before starting:
{{wait}} milliseconds
and a reasonable amount of time after each action

>>> Below are the expected results:
{{expected}}

Again, the goal is:
{{goal}}
Remember to call fnSendResults at least once

Remember, your robust javascript code will be directly passed into new Function(...);
`);

export const rateItems = new Template(
  ['expected', 'actual', 'code', 'html'],
  `You are expected and actual results from a web extraction program. You also have the the source HTML, and the code used to generate the actual results.

Provide an analyis, accuracy rating, and suggestions to improve the code (if any). You will provide these in JSON.

You will return a JSON object with the following fields:

- "accuracyAnalysis": "An analysis of how closely to expected results match the actual results. Describe any innacurate or missing fields. Note any patterns in the mistakes. Give 50-200 words."
- "codeAnalysis": "An analysis of the code, and how it could be improved, in particular as it relates to improving accuracy. Give 20-80 words.",
- "score": "A score from 1-100 of how well the the code generating the expected results functions. Focus primarly on accuracy, but also consider general code quality"
- "feedback": "Give feedback on how to improve the code, if needed. Focus primarly on how to improve accuracy. Give 10-200 words."

>>> The page HTML is:
{{html}}

>>> The code used to generate the results is:
{{code}}

>>> The expected results are:
{{expected}}

>>> The actual results are:
{{actual}}

Respond ONLY in JSON, your response will be machine parsed using JSON.parse()`);
