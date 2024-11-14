import { Template } from '../template/Template.js';

export const scrapeOnce = new Template(
  ['extraRules', 'limit', 'description', 'questions', 'url', 'text', 'html', 'count'],
  `You are a web scraping extraction program. You will receive webpage content including text and HTML from a web page. Your goal is to extract one or more items matching a user's prompt. You will first count how many items are on the page, and then extract and list each item. The page will either contain a single item, or multiple similar items that are similar. 

If you're unable to answer a question fill in the value "(not found)", but make your best guess. Prefer to give an answer if one seems plausible.

Your response will be parsed by a computer program, so respond ONLY with valid JSONL. Each line must be parseable JSON.

The first JSON object your return will have one field, "itemCount", indicating how many items are to come.

The remaining JSON objects you returns will be items. There will be one item per line. Each field in these objects corresponds to the questions.

Follow these important rules:
- Please make sure the response is valid JSONL. Only ONE JSON object per line. Remove any \n characters in questions and answers.
- The VALUES of the questions dictionary is what you are looking for
- Use EXACT SAME KEYS keys for each item as you find in the questions dictionary.
- Do NOT fix spelling errors in the item keys. If the questions contain typos, spelling errors, or other mistakes, keep those in the item dictionary keys. KEEP THEM EXACTLY!!
- Pay attention to user format specifications
- Follow schema requests, eg. return array fields if requested

{{extraRules}}

Example of a valid response with multiple items:
{"itemCount": 2}
{"authorName": "Ernest Hemingway", "bookName": "The Old Man and the Sea"}
{"authorName": "George Orwell", "bookName": "1984"}

Example of a valid response with a single item:
{"itemCount": 1}
{"article_title": "New Find at the Great Wall of China", "article_date": "2024-02-04", countries: ["China", "India"]}

Below is the user prompts. Prompt directive lines are preceded by  >>>>

>>>> Limit to this many item(s):
{{limit}}

>>>> The URL of the website:
{{url}}

>>>> Raw text from innerText of the page:
{{text}}

>>>> HTML text from innerHTML of the page (first {{count}} characters):
{{html}}

>>>> {{description}}

>>>> Below is the questions dictionary for each item(s). KEEP THE SAME KEYS:
{{questions}}
`);

export const iterative = new Template(
  ['url', 'text', 'html', 'count', 'question'],
  `You are a web scraping extraction program. You will receive webpage content including text and HTML from a web page. Your goal is to data matching a user's question. You will give only one answer. If you cannot answer the question, reply with (not found)

>>>> The URL of the website:
{{url}}

>>>> Raw text from innerText of the page:
{{text}}

>>>> HTML text from innerHTML of the page (first {{count}} characters):
{{html}}

Follow these important rules:
- Do not give an explanation text, give ONLY the answer. MAKE SURE TO FOLLOW THIS RULE.
- You will ONLY succeed if you give JUST the answer, with NO explanation text.
- For numbers, do NOT include commmas. Give ONLY the digits.

>>>> The user's question is:
{{question}}
`);

export const findMultiDescription = new Template(
  ['questions', 'url'],
  `You are part of a scraping program. You have user questions. Your goal is to figure out a 2-10 word description of the items the user is trying to scrape.

Respond in JSON format like this:

{"itemDescription": "...your 2-10 word item description..."}

The user defined fields for the item are below:
{{questions}}

The URL of the page is:
{{url}}

Based on the questions, what is the ITEM the user is trying to scrape? Response must be a noun.

Your response MUST be valid JSON and only JSON. It will be parsed with JSON.parse()
`
);

export const codeGenMulti = new Template(
  ['html', 'itemDescription', 'questions', 'sample'],
    `You writing Javascript code that will be part of a scraping program. You are a master scraping coder, and you have good intuition about what selectors and code to use to find data.

Your response will be directly executed, so respond ONLY with code, no english explanation or formatting. If you do want to give explanation, put it in comments.

You will be writing Javascript.

Your goal is to write Javascript code that finds items the user is looking for, and fills in the fields the users asks for.

There are multiple items on each page. Your code should return an ARRAY of all items.

You will receive HTML of the page, along with the correct answer for this page. Your goal is to write a good, robust Javascript code with CSS selectors that finds the answer on other similar pages. Make sure your code generalizes well to other similar pages.

Here is the HTML of the example page: {{html}}

The user is looking for these items: {{itemDescription}}

The user is looking for these fields on each item: {{questions}}

Here is the correct example answer: {{sample}}

Follow these guidelines:
- You MUST RESPOND ONLY WITH JAVASCRIPT CODE and comments
- Do NOT GIVE EXAMPLE USAGE
- You may use the node-html-parser library. It will be passed in as a parameter.
- Make your code robust, including null checks
- Loops and maps should have a try/catch structure so a single failed element does not break the entire execution

It is VERY IMPORTANT to include a comment block at the start that explains your reasoning:
- Before writing any code, explain your reasoning in a comment block
- Decide if you will use XPath via $x(...) or CSS selectors, or something else
- Decide and explain which XPath or CSS selectors you will use
- Describe how you ensure this solution will generalize and be robust with respect to HTML and CSS quirks
- Describe any challenging parts of the extraction

The response you give will be a parameter to new Function(). Therefore, do NOT give a function signature. The function will be called with a TWO named parameters:
- \`html\`: the HTML of the page
- \`nodeHtmlParser\`: the node-html-parser library
Use ONLY these parameters in your code

Make sure to RETURN the result at the end

`);

export const codeGenFeedback = new Template(
  ['html', 'itemDescription', 'questions', 'code', 'expected', 'actual'],
  `You are a code reviewer, and you are asked to evaluate scraping extract code. You will receive HTML of the target page for extraction, the data to be extracted, the proposed code for doing the extract, and expected and actual results.

You will give feedback in JSON format on the code:

{
  "problems": "Describe problems in the actual results compared to the expected results, if any",

  "accuracy": "A rating from 1 to 100 of how accurate the actual results are, compared to the expected results. Scores near 1 mean the actual output is unusable, scores near 50 mean the actual output is ok but has doesn't exactly match, scores near 90 and above mean the actual output exactly matches the expected, maybe small issues like whitespace",

  "quality": "A rating from 1 to 100 of the code quality, taking into account expected breakage and future problems that could arise. Be careful not to overengineer, this is scraping code",

  "suggestions": "Give suggestions on how to improve the code, if any"
}

Below is your task:

>>>> Page HTML:
{{html}}

>>>> Extraction target description: {{itemDescription}}

>>>> Extraction fields:
{{questions}}

>>>> Expected results:
{{expected}}

>>>> Actual results:
{{actual}}

>>>> Proposed code:
{{code}}


- Limit your response to 500 words total.
- You MUST reply in JSON, your response will be fed into JSON.parse()
`);

export const codeGenIterate = new Template(
  ['html', 'itemDescription', 'questions', 'expected', 'actual', 'code', 'feedback'],
  `You working on Javascript code that will be part of a scraping program. You are a master scraping coder, and you have good intuition about what selectors and code to use to find data. Your response will be directly executed, so respond ONLY with code, no english explanation or formatting. If you do want to give explanation, put it in comments. You will be writing Javascript.

Your goal is to write Javascript code that finds items the user is looking for, and fills in the fields the users asks for.

You will be given some code that you wrote previously, along with some feedback. Take t
he feedback, and use it to improve the code you wrote.

>>>> Here is the HTML of the example page: {{html}}

>>>> The user is looking for these items: {{itemDescription}}

>>>> The user is looking for these fields on each item: {{questions}}

>>>> Here is the correct example answer: {{expected}}

>>>> Here is the actual answer from the given code: {{actual}}

>>>> Here is the code you are improving:
{{code}}

>>>> Here is the feedback on this code:
{{feedback}}

Follow these guidelines:
- You MUST RESPOND ONLY WITH JAVASCRIPT CODE and comments
- Do NOT GIVE EXAMPLE USAGE
- You may use the node-html-parser library. It will be passed in as a parameter.
- Make your code robust, including null checks
- Loops and maps should have a try/catch structure so a single failed element does not break the entire execution

It is VERY IMPORTANT to include a comment block at the start that explains your reasoning:
- If you made changes, explain the changes compared to the previous code, and why you think it will fix any issues
- If you made no changes, say so, and say why not
- You may disregard feedback that would make the code too complicated, more brittle, or that is too hard to integrate. Consider the feedback and use your best judgement.

The response you give will be a parameter to new Function(). Therefore, do NOT give a function signature. The function will be called with a TWO named parameters:
- \`html\`: the HTML of the page
- \`nodeHtmlParser\`: the node-html-parser library
Use ONLY these parameters in your code

Make sure to RETURN the result at the end

`
)
