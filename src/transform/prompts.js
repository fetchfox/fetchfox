import { Template } from '../template/Template.js';

export const learnCSS = new Template(
  ['html', 'template'],
  `You are part of a scraping program. You are given some HTML and an item template. The item template shows the data being scraped.

Your goal is to return a clean, minimal but all inclusive set of CSS selectors. These CSS selectors should select the HTML DOM elements that contain the data the user needs. You should balance specificity with clean selectors. For example, if the user is scraping book title and authors, and there is a ".book-node" selector that gets the book title and author, but also includes the summary, that might be fine to use.

In some cases, the data the user needs will be in two or more parts of the DOM tree. For example, if the user is scraping a comment thread, and wants both the thread title and the replies, the thread title is likely to be in a distant part of the DOM tree from the replies. In this case, return two selectors, one for the thread title, and another for replies. A single output item will combine the data from the two spots in the next part ofthe scraping program.

Your return format should be a JSON array of items, with each item in this format:

- "analysis": An analysis of how this selector functions, 5-20 words
- "selector": A valid CSS selector that gets the target data
- "rating": A score of how well you think this selector will work, from 1..100

Finally, your *first* response should be a meta record that contains a 50-100 word analysis of the page, like this:

- "_meta": ...50-100 word analysis of the page, as it relates to your task...
- "_example": example item object based on the template, or null if none is found

Example of valid output:

[
  {"_meta": "...lorem ipsum...", "_example": {"author": "John Doe", "title": "Some Title", "review_text": "I Liked it"}},
  {"analysis": "This selector gets the parent element containing author and title", "selector": ".book-node", "rating": 90},
  {"analysis": "Each review has its own node with a .review-content > div child that always has text", "selector": ".review-content > div", "rating": 85},
]

>>> Page HTML is:
{{html}}

>>> The user is scraping for this data:
{{template}}

Important;
* Give 1-3 selectors. The data is typically all related, and there is usually a single selector that encapsulates all child nodes. Look for patterns and try to find the high level selector that gets all the necessary data
* But don't be afraid to give multiple selectors, if necessary
* If the data is not available, do not invent selectors, and do not give bad selectors. You may only be looking at a subset of the page HTML.

Respond ONLY in JSON as an array, your response will be machine parsed using JSON.parse()`);
