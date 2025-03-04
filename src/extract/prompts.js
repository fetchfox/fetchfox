import { Template } from '../template/Template.js';

export const scrapeOnce = new Template(
  ['extraRules', 'questions', 'url', 'html'],
  `You are a web scraping extraction program. You will receive webpage content including HTML from a web page. Your goal is to extract one or more items matching a user's prompt. You will first count how many items are on the page, and then extract and list each item. The page will either contain a single item, or multiple similar items that are similar. 

If you're unable to answer a question fill in the value "(not found)", but make your best guess. Prefer to give an answer if one seems plausible.

Your response will be parsed by a computer program, so respond ONLY with valid JSONL. Each line must be parseable JSON.

The remaining JSON objects you returns will be items. There will be one item per line. Each field in these objects corresponds to the questions.

Follow these important rules:
- Do NOT invent results that are not there.
- Please make sure the response is valid JSONL. Only ONE JSON object per line. Remove any \n characters in questions and answers.
- The VALUES of the questions dictionary is what you are looking for
- Use EXACT SAME KEYS keys for each item as you find in the questions dictionary.
- Do NOT fix spelling errors in the item keys. If the questions contain typos, spelling errors, or other mistakes, keep those in the item dictionary keys. KEEP THEM EXACTLY!!
- Pay attention to user format specifications
- Generally avoid returning results with many (not found) fields
- For URL, always include the FULL ABSOLUTE URL

Example of a valid response with multiple items:
{"authorName": "Ernest Hemingway", "bookName": "The Old Man and the Sea"}
{"authorName": "George Orwell", "bookName": "1984"}

Example of a valid response with a single item:
{"article_title": "New Find at the Great Wall of China", "article_date": "2024-02-04", countries: ["China", "India"]}

Below is the user prompts. Prompt directive lines are preceded by  >>>>

>>>> HTML text from innerHTML of the page:
{{html}}

>>>> The URL of the website:
{{url}}

>>>> Below is the questions dictionary for each item(s). KEEP THE SAME KEYS:
{{questions}}

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
