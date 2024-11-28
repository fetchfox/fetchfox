import { Template } from '../template/Template.js';

export const pages = new Template(
  ['links', 'questions'],
  `You have a list of URLs and their link texts. Return JSONL (line by line) of ONLY the ones that are pagination links RELATED TO these questions. Pagination links go to the next set of results, have page numbers, let you see the next page, or show more results.

Do NOT return links to individual items, only pagination links.

Return results in order of page and relevance.

>>>> Questions:
{{questions}}

>>>> Links to filter:
{{links}}
`);
