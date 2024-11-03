import { Template } from '../template/Template.js';

export const singleStep = new Template(
  ['stepLibrary', 'allSteps', 'step', 'user'],
  `You are planning a single step in a scraping or web automation program. You will receive a series of user promps, each of which indicates one step in the automation. Then, you will provide a JSON definition of the proper step to take.

Your JSON definition will be based on the available steps in the scraping library, which are described below. You must select both the proper step type, as well as the arguments to the step.

The step types, and their arguments, are listed below:
{{stepLibrary}}

Example of valid output:
{ name: "crawl", args: { query: "Find off-site links to articles, and ignore navigation and ads" } }
{ name: "crawl", args: { query: "Find links to products that are related to basketball. Ignore all other products and links", limit: 8 } }

{{user}}

The full steps are:
{{allSteps}}

Your task is to return JSON definition for this step:
{{step}}

Make sure to ONLY return JSON, with no explanation. Your output will parsed using JSON.parse()
`);

export const combined = new Template(
  ['stepLibrary', 'prompt', 'user', 'url', 'html'],
  `You are generating a plan for a web scraping program. You will receive a user prompt, and your goal is to output a JSON definition that plans out that scrape.

Your JSON definition will be based on the available steps in the scraping library, which are described below. You must select both the proper step type, as well as the arguments to the step. You MUST only use steps from this library.

The step types, and their arguments, are listed below:
{{stepLibrary}}


Follow these guidelines:
- Most scrapes will have an extract step. Include one of these unless there's a good reason not to.
- Usually the extract step will follow the crawl step. Do it in this order unless you have a good reason not to.
- Do not include an export step unless there is indication that the user wants one.
- If the step is in JSON and includes "name" and "prompt" fields, then you MUST honor the "name" field, and use the "prompt" to generate EXACTLY ONE step of ONLY the specified name type.


Example of valid output:
[
  {"name":"const","args":{"items":[{"url":"https://news.ycombinator.com/news"}]}},
  {"name":"crawl","args":{"query":"Look for links to user profile pages. Ignore navigation links, links to posts, and advertisements.","limit": 12}},
  {"name":"extract","args":{"questions":["What is the username of this profile?","What is the number of followers?","What is the bio?","What is the URL? Format: Absolute URL"],"single":true}},
  {"name":"export","args":{"filename":"hn.jsonl","format":"jsonl"}},
]

{{user}}

{{url}}

{{html}}

The user prompt is:
{{prompt}}

Make sure to ONLY return JSON, with no explanation. Your output will parsed using JSON.parse()
`);

export const describe = new Template(
  ['job'],
  `Suggest a description, name, and slug for the scraping job below.

Respond in JSON format:

{
  "description": "Describe the scrape job...",
  "name": "Your name suggestion...",
  "slug": "your-slug-suggestion"
}

- The description should tell the user what the scrape does, and mention the domain of the site being scraped.
- Description should be 10-25 words.
- Make your name suggestion concise, relevant, and between 3-10 words.
- Try to avoid redundancy between name and description.
- Make the slug a concise ID of the name, 1-3 terms, dash connected. ONLY JSON, no markdown.
- Do NOT mention the word "information" or "data" or similar terms in the name
- Instead, focus on relevant topical terms in the name that are likely to uniquely identify this scraper in a list of many others
- Uppercase the first letter of the name, uppercase proper noun

The scrape job you are describing and naming is:
{{job}}
`);
