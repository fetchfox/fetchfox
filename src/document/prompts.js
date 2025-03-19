import { Template } from '../template/Template.js';

export const learnCSS = new Template(
  ['html', 'template', 'format'],
  `Given some HTML, give me the CSS selector to select all the elements related to what the user is scraping. Do not use pseudo-elements, selectors should be compatible with css-select.

This will later be used to generate a list containing objects with answers to each field's prompt.
If and only if there is a field where each element should distribute to multiple subsequent objects, add it to a list of field name under the "_shared" key.

>>> Page HTML is:
{{html}}

>>> The user is scraping for this data:
{{template}}

>>> Respond in JSON format:
{{format}}

Respond ONLY in JSON, your response will be machine parsed using JSON.parse()`);
