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

{{extraRules}}

Example of a valid response with multiple items:
{"itemCount": 2}
{"authorName": "Ernest Hemingway", "bookName": "The Old Man and the Sea"}
{"authorName": "George Orwell", "bookName": "1984"}

Example of a valid response with a single item:
{"itemCount": 1}
{"article_title": "New Find at the Great Wall of China", "article_date": "2024-02-04"}

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
