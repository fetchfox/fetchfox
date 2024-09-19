import { Template } from '../template/Template.js';

export const basic = new Template(`You are a web scraping extraction program. You will receive webpage content including text and HTML from a web page. Your goal is to extract one or more items matching a user's prompt. You will first count how many items are on the page, and then extract and list each item. The page will either contain a single item, or multiple similar items that are similar. 

If you're unable to answer a question fill in the value "(not found)", but make your best guess. Prefer to give an answer if one seems plausible.

Your response will be parsed by a computer program, so respond ONLY with valid JSONL. Each line must be parseable JSON.

The first JSON object your return will have one field, "itemCount", indicating how many items are to come.

The remaining JSON objects you returns will be items. There will be one item per line. Each field in these objects corresponds to the questions.

Follow these important rules:
- Please make sure the response is valid JSONL. Only ONE JSON object per line. Remove any \n characters in questions and answers.
- Use EXACT SAME KEYS keys for each item as you find in the questions dictionary.
- Do NOT fix spelling errors in the item keys. If the questions contain typos, spelling errors, or other mistakes, keep those in the item dictionary keys. KEEP THEM EXACTLY!!
- Maximum 20 items

{{extraRules}}

Example of a valid response with multiple items:
{"itemCount": 2}
{"What is the author's name?": "Ernest Hemingway", "What is the book's name?": "The Old Man and the Sea"}
{"What is the author's name?": "George Orwell", "What is the book's name?": "1984"}

Example of a valid response with a single item:
{"itemCount": 1}
{"What is the article's title?": "New Find at the Great Wall of China", "What is the article's date in YYYY-MM-DD format?": "2024-02-04"}

Below is the user prompts. Prompt directive lines are preceded by  >>>>

>>>> Limit to this many item(s):
{{limit}}

>>>> {{description}}

>>>> Below is the questions dictionary for each item(s). KEEP THE SAME KEYS:
{{questions}}

>>>> The URL of the website:
{{url}}

>>>> Raw text from innerText of the page:
{{text}}

>>>> HTML text from innerHTML of the page (first {{count}} characters):
{{html}}
`);

export const single = new Template(`You are a web scraping extraction program. You will receive webpage content including text and HTML from a web page. Your goal is to data matching a user's question. You will give only one answer. If you cannot answer the question, reply with (not found)

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

export const codeGen = new Template(`You are writing code to help with web scraping. You will write a function that takes HTML, and returns a subset of that HTML. The subset should contain the answer to a question that the user has. It should be a minimal subset, containing the information related to that question.

You will write code that should work on many similar pages. You will receive one example, and expect other pages to follow a similar pattern, but with different content. Be observant of patterns in the page. Consider what is likely to change, and what is likely to remain stable.


Your function signature should look like this:

// ...explain your reasoning in a comment...
function findHTMLWithAnswer(fullHtml) {
  const $ = cheerio.load(fullHtml);
  // your code goes here
  return partialHtml;
}

The question is: {{question}}

== Example ==
Example URL is: {{url}}

Example HTML is:
{{html}}

Example answer is: {{answer}}

Respond with a step-by-step explanation of how your code works. The explanation MUST be in comments. Then, write your code.

Your response will be DIRECTLY executed, so make sure that it is valid syntax, and all of it is valid code or comments.

Follow these important guidelines:
- Your Javscript should be ES6.
- Do not use any libraries.
- Do mainly text processing, and prefer to over-match.
- Your code will run in the browser or in node.js.
- Do not rely on classnames that are likely to change, such as obfuscated class names
- You MUST NOT include any explanation text outside of comments
`);
