import { Template } from '../template/Template.js';

export const learnCSS = new Template(
  ['html', 'template'],
  `You are part of a scraping program. You are given some HTML and an item template. The item template shows the data being scraped.

Your goal is to return a clean, minimal but all inclusive set of CSS selectors. These CSS selectors should select the HTML DOM elements that contain the data the user needs. You should balance specificity with clean selectors. For example, if the user is scraping book title and authors, and there is a ".book-node" selector that gets the book title and author, but also includes the summary, that might be fine to use.

In some cases, the data the user needs will be in two or more parts of the DOM tree. For example, if the user is scraping a comment thread, and wants both the thread title and the replies, the thread title is likely to be in a distant part of the DOM tree from the replies. In this case, return two selectors, one for the thread title, and another for replies. A single output item will combine the data from the two spots in the next part ofthe scraping program.

Your return format should be a JSON array of items, with each item in this format:

- "coverageAnalyis": Describe which data fields this selector includes, in 50 words
- "precisionAnalysis": Describe how precise this selector is. Precise selectors do not grab more data than they need. 50 words
- "stabilityAnalysis": Describe how stable you expect this selector to be. Stable selectors are semantic, unlikely to change, and not overly complex. Unstable selectors depend on specific dom layouts, and/or are random strings of characters that appear machine generated. 50 words
- "analysis": Overall quality analysis of this selector, 30 words
- "selector": A valid CSS selector that gets the target data
- "coverage": A score of how good the coverage for this selector is, from 1..100. Roughly it desribes percent of data available if we use this selector
- "precision": A score of how good the precision for this selector is, from 1..100. More precise is better
- "stability": A score of how stable you expect this selector to be, from 1..100. Semantic selectors are more stable, random string selectors are less stable
- "rating": A score of how well you think this selector will work, combining coverage, stability, precision, and other factors, from 1..100

Finally, your *first* response should be a meta record that contains a 50-100 word analysis of the page, like this:

- "_meta": ...50-100 word analysis of the page, as it relates to your task...
- "_example": example item object based on the template, or null if none is found

Example of valid output:

[
  {"_meta": "...lorem ipsum...", "_example": {"author": "John Doe", "title": "Some Title", "review_text": "I Liked it"}},
  {"analysis": "This selector gets the parent element containing author and title", "coverageAnalysis": "this gets both book author, title, and review text as requested", "precisionAnalysis": "it grabs some extra data we don't need, like star rating, and metadata", "selector": ".book-node", "stability": 95, "coverage": 100, "precision": 65, "rating": 90},
  {"analysis": "Each review has its own node with a .review-content > div child that always has text", "coverageAnalyis": "It only gets the review text", "precisionAnalysis": "it has lots of uncessary data for this extraction, like review author and links off site", "selector": ".review-content > div.y3dxbd", "stability": 25, "coverage": 35, "precision": 25, "rating": 85},
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
