import { Template } from '../template/Template.js';

export const checkLoading = new Template(
  [],
  `Look at the attached image, and check for indications that it is loading, like loading spinners, as well as content ready state.

- Count the number of loading indicators and give that number.
- Figure out what type of content there is on the page, and summarize it in 1-5 words
- Figure out approximately how many of those content items appear
- Decide if the page is currently loading, responding either true or false
- Check whether the content appears not ready, partialy ready, or fully ready, responding either "not-ready", "partialy-ready", or "fully-ready".
  - "not-ready" means there is no content at all on the page, typically content count == 0
  - "partialy-ready" means there is some content on the page, but more is still loading, typically content count > 0
  - "fully-ready" means the page is done loading, and no more content is expected, typically content count > 0

Your response MUST be in valid JSON format, like this:

{
  "numberOfLoadingIndicators": number,
  "contentType": string,
  "contentCount": number,
  "isLoading": boolean
  "readyState": string
}

Examples of valid responses:

{
  "numberOfLoadingIndicators": 0,
  "contentType": "new articles",
  "contentCount": 8,
  "isLoading": false,
  "readyState": "fully-ready"
}

{
  "numberOfLoadingIndicators": 2,
  "contentType": "social media posts",
  "contentCount": 2,
  "isLoading": true,
  "readyState": "partially-ready"
}`);

export const checkLoadingShort = new Template(
  [],
  `Look at the attached image, and check for indications that it is loading, like loading indicators, as well as content ready state.

Your response MUST be in valid JSON format, like this:

{
  "numberOfLoadingIndicators": number,
  "isLoading": boolean
  "contentType": string,
  "readyState": string, one of 'not-ready', 'partially-ready', or 'fully-ready'
}
`);
