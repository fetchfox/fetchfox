import { Template } from '../template/Template.js';

export const learnCSS = new Template(
  ['html', 'template', 'format'],
  `Given some HTML, give me the CSS selector to select all the elements related to what the user is scraping.

>>> Page HTML is:
{{html}}

>>> The user is scraping for this data:
{{template}}

>>> Respond in JSON format:
{{format}}

Respond ONLY in JSON, your response will be machine parsed using JSON.parse()`);
