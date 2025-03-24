import { Template } from '../template/Template.js';

export const scrapeOnce = new Template(
  ['extraRules', 'questions', 'url', 'body'],
  `You are a web scraping extraction program. You will receive webpage content including HTML from a web page. Your goal is to extract one or more items matching a user's prompt. You will first count how many items are on the page, and then extract and list each item. The page will either contain a single item, or multiple similar items that are similar.

If you're unable to answer a question fill in the value "(not found)", but make your best guess. Prefer to give an answer if one seems plausible.

Your response will be parsed by a computer program, so respond ONLY with valid JSONL. Each line must be parseable JSON.

The remaining JSON objects you returns will be items. There will be one item per line. Each field in these objects corresponds to the questions.

Example of a valid response with multiple items:
{"authorName": "Ernest Hemingway", "bookName": "The Old Man and the Sea"}
{"authorName": "George Orwell", "bookName": "1984"}

Example of a valid response with a single item:
{"article_title": "New Find at the Great Wall of China", "article_date": "2024-02-04", countries: ["China", "India"]}

Below is the user prompts. Prompt directive lines are preceded by  >>>>

>>>> HTML text from innerHTML of the page:
{{body}}

>>>> The URL of the website:
{{url}}

>>>> Below is the questions dictionary for each item(s). KEEP THE SAME KEYS:
{{questions}}

Follow these important rules:
- Do NOT invent results that are not there. Sometimes, there will be no results at all.
- ONLY return data that you see in the HTML of the page.
- Please make sure the response is valid JSONL. Only ONE JSON object per line. Remove any \n characters in questions and answers.
- The VALUES of the questions dictionary is what you are looking for
- Use EXACT SAME KEYS keys for each item as you find in the questions dictionary.
- Do NOT fix spelling errors in the item keys. If the questions contain typos, spelling errors, or other mistakes, keep those in the item dictionary keys. KEEP THEM EXACTLY!!
- Pay attention to user format specifications
- Generally avoid returning results with many (not found) fields
- For URL, always include the FULL ABSOLUTE URL

{{extraRules}}
`);

export const scrapeSelect = new Template(
  ['extraRules', 'questions', 'url', 'body', 'hint'],
  `You are a web scraping extraction program. You will receive webpage content including HTML from a web page. Your goal is to extract one or more items matching a user's prompt. You will first count how many items are on the page, and then extract and list each item. The page will either contain a single item, or multiple similar items that are similar.

If you're unable to answer a question fill in the value "(not found)", but make your best guess. Prefer to give an answer if one seems plausible.

Your response will be parsed by a computer program, so respond ONLY with valid JSONL. Each line must be parseable JSON.

The remaining JSON objects you returns will be items. There will be one item per line. Each field in these objects corresponds to the questions.

Example of a valid response with multiple items:
{"authorName": "Ernest Hemingway", "bookName": "The Old Man and the Sea"}
{"authorName": "George Orwell", "bookName": "1984"}

Example of a valid response with a single item:
{"article_title": "New Find at the Great Wall of China", "article_date": "2024-02-04", countries: ["China", "India"]}

Below is the user prompts. Prompt directive lines are preceded by  >>>>

>>>> HTML generated from selections from the page:
{{body}}

>>>> The URL of the website:
{{url}}

>>>> The next line may provide a hint about how to process the items:
{{hint}}

>>>> Below is the questions dictionary for each item(s). KEEP THE SAME KEYS:
{{questions}}

Follow these important rules:
- Do NOT invent results that are not there. Sometimes, there will be no results at all.
- ONLY return data that you see in the HTML of the page.
- Please make sure the response is valid JSONL. Only ONE JSON object per line. Remove any \n characters in questions and answers.
- The VALUES of the questions dictionary is what you are looking for
- Use EXACT SAME KEYS keys for each item as you find in the questions dictionary.
- Do NOT fix spelling errors in the item keys. If the questions contain typos, spelling errors, or other mistakes, keep those in the item dictionary keys. KEEP THEM EXACTLY!!
- Pay attention to user format specifications
- Generally avoid returning results with many (not found) fields
- For URL, always include the FULL ABSOLUTE URL

{{extraRules}}
`);

export const scrapeJson = new Template(
  ['extraRules', 'questions', 'url', 'body', 'hint'],
  `You are a web scraping extraction assistant. You will receive JSON content selected from a web page in a prior step. Your goal is to extract one or more items matching a user's prompt. You will first count how many items are in the JSON, and then extract and list each item. The JSON will either contain a single item, or multiple similar items that are similar.

If you're unable to answer a question fill in the value "(not found)", but make your best guess. Prefer to give an answer if one seems plausible.

Your response will be parsed by a computer program, so respond ONLY with valid JSONL. Each line must be parseable JSON.

The remaining JSON objects you returns will be items. There will be one item per line. Each field in these objects corresponds to the questions.

Example of a valid response with multiple items:
{"authorName": "Ernest Hemingway", "bookName": "The Old Man and the Sea"}
{"authorName": "George Orwell", "bookName": "1984"}

Example of a valid response with a single item:
{"article_title": "New Find at the Great Wall of China", "article_date": "2024-02-04", countries: ["China", "India"]}

Below is the user prompts. Prompt directive lines are preceded by  >>>>

>>>> JSON with text from the page:
{{body}}

>>>> The URL of the website:
{{url}}

>>>> The next line may provide a hint about how to process the items:
{{hint}}

>>>> Below is the questions dictionary for each item(s). KEEP THE SAME KEYS:
{{questions}}

Follow these important rules:
- Do NOT invent results that are not there. Sometimes, there will be no results at all.
- ONLY return data that you see in the JSON.
- Please make sure the response is valid JSONL. Only ONE JSON object per line. Remove any \n characters in questions and answers.
- The VALUES of the questions dictionary is what you are looking for
- Use EXACT SAME KEYS keys for each item as you find in the questions dictionary.
- Do NOT fix spelling errors in the item keys. If the questions contain typos, spelling errors, or other mistakes, keep those in the item dictionary keys. KEEP THEM EXACTLY!!
- Pay attention to user format specifications
- Generally avoid returning results with many (not found) fields
- For URL, always include the FULL ABSOLUTE URL

{{extraRules}}
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
`);

export const learnCSS = new Template(
  ['html', 'template', 'format'],
  `Given some HTML, give me the CSS selector to select all the elements related to what the user is scraping.

>>> Page HTML is:
{{html}}

>>> The user is scraping for this data:
{{template}}

>>> Respond in JSON format:
{{format}}

Follow these guidelines
* Do NOT encode specific information in the selectors
* Do NOT use any pseudo selectors
* It is ok to overmatch data as long as you include the requested data

Respond ONLY in JSON, your response will be machine parsed using JSON.parse()`);

export const aiProcess = new Template(
  ['item'],
  `You are performing post processing on the output of a data extract process. This process needs an AI LLM like you to to determine the value of a field that is subjective or hard to generate using just code.

You will be given a JSON object with keys and values. The values are instructions for how to generate the output for that key. Follow the instructions in the values, and output a JSON object in the same shape as the input.

>>> The input item is:
{{item}}

Respond ONLY in JSON, your response will be machine parsed using JSON.parse()`);
