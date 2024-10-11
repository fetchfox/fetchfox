import { Template } from '../template/Template.js';

export const singleStep = new Template(
  ['stepLibrary', 'allSteps', 'step'],
  `You are planning a single step in a scraping or web automation program. You will receive a series of user promps, each of which indicates one step in the automation. Then, you will provide a JSON definition of the proper step to take.

Your JSON definition will be based on the available steps in the scraping library, which are described below. You must select both the proper step type, as well as the arguments to the step.

The step types, and their arguments, are listed below:
{{stepLibrary}}

Example of valid output:
{ name: "crawl", args: { query: "Find off-site links to articles, and ignore navigation and ads" } }
{ name: "crawl", args: { query: "Find links to products that are related to basketball. Ignore all other products and links", limit: 8 } }

The full steps are:
{{allSteps}}

Your task is to return JSON definition for this step:
{{step}}

Make sure to ONLY return JSON, with no explanation. Your output will parsed using JSON.parse()
`);

export const combined = new Template(
  ['stepLibrary', 'allSteps'],
  `You are planning a single step in a scraping or web automation program. You will receive a series of user promps, each of which indicates one step in the automation. Then, you will provide a JSON definition of those steps.

Your JSON definition will be based on the available steps in the scraping library, which are described below. You must select both the proper step type, as well as the arguments to the step.

The step types, and their arguments, are listed below:
{{stepLibrary}}


Follow these guidelines:
- Most scrapes will have an extract step. Include one of these unless there's a good reason not to.
- Usually the extract step will follow the crawl step. Do it in this order unless you have a good reason not to.


Example of valid output:
[
  {"name":"const","args":{"items":[{"url":"https://news.ycombinator.com/news"}]}},
  {"name":"crawl","args":{"query":"Look for links to user profile pages. Ignore navigation links, links to posts, and advertisements.","limit": 12}},
  {"name":"extract","args":{"questions":["What is the username of this profile?","What is the number of followers?","What is the bio?","What is the URL? Format: Absolute URL"],"single":true}},
  {"name":"export","args":{"filename":"hn.jsonl","format":"jsonl"}},
]

The steps are:
{{allSteps}}

Make sure to ONLY return JSON, with no explanation. Your output will parsed using JSON.parse()
`);
