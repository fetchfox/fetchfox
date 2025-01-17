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
`,
);

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
`,
);

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
`,
);

export const prePlan = new Template(
  ['url', 'html', 'prompt'],
  `You are part of a web scraping program, and your job is to take a "master prompt" from the user, and generate the JSON job definition for the web scrape.

You will receive a prompt from the user, describing what they wish to scrape.

You will also receive information about the starting page of the scrape, including its URL, HTML, and text.

You will return a JSON object with the following fields, in this order:

- "intentAnalysis": A 10-30 word summary of the user's likely intent, given the user prompt and the page information.

- "itemDescription": A 2-5 word description of the items the user is trying to scrape. Try to infer the general item based on the intent.

- "singleOrMultiple": Is there a single item of this type on the page, or multiple?

- "detailFields": An array defining the field(s) the user is looking for, based on "intentAnalysis" and the prompt. IF THERE IS A PROMPT GIVEN, base this off the prompt.
- For "detailFields", follow these guidelines:
  - For URLs and links, that detail field SHOULD SPECIFY absolute URL format

- "dataAvailability": For each item in "detailFields", decide whether it is available on current page. True = available on current page, false = available on a linked page

- "scrapeTypeGuess": Either "singlePage" or "multiPage". Respond with "singlePage" if the current page has all the items, and all the DETAILS the user wants to scrape. Respond with "multiPage" if these items are LINKED from the current page, and the LINKED pages are needed to get ALL the details the user is looking for. This is your first guess, which you will have a chance to revise.

- "scrapeTypeReason": Explain in 3-8 words why you made your guess in "scrapeTypeGuess".

- "scrapeType": Your FINAL answer for the scrape type, either "singlePage" or "multiPage". Change only if you need to after thinking about it in "scrapeTypeReason"

- "perPage": IF scrapeType is "singlePage", answer either "single" or "multiple". Answer "single" if there is only one item on the page to scrape. Answer "multiple" if there are multiple items on the page to scrape.

- "gatherPrompt": If this is "singlePage", return "". If this is "multiPage", describe how to find the linked pages that contain all the detail fields. Exclusions are important to clear up confusion.

Example output 1:
{
  "intentAnalysis": "The user is likely looking for ratings and information about products to evaluate which one to buy",
  "itemDescription": "Product reviews and information",
  "singleOrMultiple": "single",
  "detailFields": [
    "What is the name of this product?",
    "What is the rating of this product? Format: X.X/X",
    "Who made this product?",
    "What is the URL of this product? Format: full absolute URL",
    "What is the price of this product? Format: $XX.XX"
  ],
  "dataAvailability": [
    true,
    false,
    true,
    false,
  ],
  "scrapeTypeGuess": "multiPage",
  "scrapeTypeReason": "The product rating and price are only available on the indivdiual pages",
  "scrapeType": "multiPage",
  "gatherPrompt": "Find links to products. Ignore category links, page navigation, and advertisements"
}

Example output 2:
{
  "intentAnalysis": "The user wants to find candidates for a job based on the results from a search page",
  "itemDescription": "Job applicant candidates",
  "singleOrMultiple": "multiple"
  "detailFields": [
    "What is the name of this person?",
    "What is this person's current employer?",
    "What is this peerson's current job title?",
    "What is the full URL of their profile?"
  ],
  "dataAvailability": [
    true,
    true,
    true,
    true,
  ],
  "scrapeTypeGuess": "singlePage",
  "scrapeTypeReason": "All the data is available on the current page, so I don't need to load extra pages",
  "scrapeType": "singlePage",
  "gatherPrompt": ""
}

Page URL: {{url}}

Page HTML: {{html}}

User prompt: {{prompt}}

You MUST respond with ONLY the JSON object, no comments, no explanation. Otherwise you fail the task.`,
);

export const guided = new Template(
  [
    'stepLibrary',
    'prompt',
    'intent',
    'itemDescription',
    'singleOrMultiple',
    'detailFields',
    'url',
    'shouldCrawl',
    'itemsPerPage',
  ],
  `You are generating a plan for a web scraping program. You will receive a user prompt, and your goal is to output a JSON definition that plans out that scrape.

Your JSON definition will be based on the available steps in the scraping library, which are described below. You must select both the proper step type, as well as the arguments to the step. You MUST only use steps from this library.

The step types, and their arguments, are listed below:
{{stepLibrary}}

Example of valid output:
[
  {"name":"const","args":{"items":[{"url":"https://news.ycombinator.com/news"}]}},
  {"name":"crawl","args":{"query":"Look for links to user profile pages. Ignore navigation links, links to posts, and advertisements.","limit": 12}},
  {"name":"extract","args":{"questions":["What is the username of this profile?","What is the number of followers?","What is the bio?","What is the URL? Format: Absolute URL"],"single":true}},
  {"name":"export","args":{"filename":"hn.jsonl","format":"jsonl"}},
]

Make sure to ONLY return JSON, with no explanation. Your output will parsed using JSON.parse()

The user's scraping job is as follows:

The user top level prompt is: {{prompt}}

The intent of this scrape is: {{intent}}

The user is looking for this type of item: {{itemDescription}}

This is a guess of whether there is one item or multiple items: {{singleOrMultiple}}

The user wants to extract these fields for each item:
{{detailFields}}

Page URL is: {{url}}

{{shouldCrawl}}

{{itemsPerPage}}
`,
);
