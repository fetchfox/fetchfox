import { Template } from '../../template/Template.js';

const BASE_PROMPT_INTRO = `
You're part of an AI-powered web crawler.`;

const BASE_PROMPT_JSON_INSTRUCTIONS = `
Please output JSON, and just the JSON (don't include any text before or after),
because your output will be parsed programmatically. Don't output a code block
either; literally just output the raw JSON text.

Make sure to output VALID JSON. Your response must be parsable by a JSON parser.`;

export const scrapeType = new Template(
  ['prompt'],
  `
${BASE_PROMPT_INTRO}

The user has provided a prompt of what he wants to scrape. Your job is to
interpret his request and determine what type of request it is. You can respond
with ONE of the following. Data types are given in pseudo-TypeScript.

1. Fetch many. The user wants to go to a web page and fetch all items of a
certain type. For instance, if we're on a shopping page and we want to fetch
all the items for sale.

    type FetchManyResponse = {
      type: 'fetch_many';
    }

2. Fetch one. The user wants to go to a web page and fetch one instance of
something. For instance, if we're on a website and they just want to get one
set of facts, like the name of the company behind the site or something.

    type FetchOneResponse = {
      type: 'fetch_one';
    }

3. Could be either fetch-many or fetch-one depending on the situation. This
might be a more rare case; use your judgment.

    type EitherResponse = {
      type: 'either';
    };

${BASE_PROMPT_JSON_INSTRUCTIONS}

Here's the user's prompt:

{{prompt}}`,
);

export const analyzePage = new Template(
  ['prompt', 'html'],
  `
${BASE_PROMPT_INTRO}

I'll give you an html page and a prompt from the user describing what he wants
scraped.

Your job is to figure out what kind of page we're currently on. Please respond with the following data schema.
Data types are given in pseudo-TypeScript. Here's the base response.

type BaseResponse = {
    // what is the type of item being scraped? for instance, if we were scraping
    // products from an online store, this might be "store product" or "product"
    thingBeingScraped: string; 
    
    // what fields are being scraped? for instance, if the prompt is to scrape
    // products and their names and prices, this would be ["name", "price"]
    fieldsBeingScraped: string[];
}

You can respond with one of the following extensions of BaseResponse.

1. The current page is the "list view." If we were scraping X, this would be the page
containing a list of X. You should only return this if it is the list view specifically for
the thing we're scraping for. If it's a list view for some different data, do not return this

    type ListViewResponse = BaseResponse & {
      pageType: "list_view";

      // indicates whether all the data the user wants scraped is present on
      // the current page. the information for EVERY field must be present, if only
      // SOME are present, you must return false.
      everyFieldIsPresent: boolean; 
        
      // selector that grabs elements containing urls to the detail-view pages.
      // if unavailable, return null.
      detailViewUrlSelector: string | null;

      // e.g. "href" if the selected element is an <a> tag. if unavailable,
      // null. typically this is href, but in rare cases it might be a data
      // attribute. this must be an actual URL, and must be stored in an
      // attribute fetchable using javascript's node.getAttribute(). e.g.
      // innerText and innerHTML and contentText are not allowed -- return null
      // instead.
      detailViewUrlAttribute: string | null;

      // any extra comments that would help in the scraping or clarify previous
      // attributes e.g. if the detail view url isn't contained in an attribute
      // or something
      comments: string;
    }

2. The current page is the "detail view." For instance, if we were scraping
store items this could be the page for a single item.

    type DetailViewResponse = BaseResponse & {
      pageType: "detail_view";

      // the url to go back to the general "list view," if it exists
      listViewUrl: string | null;

      // any extra comments that would help in the scraping or clarify previous attributes
      comments: string;
    }

3. The current page is none of the above. Return this if there are no instances
of the thing the user wants to scrape for.

    type UnknownResponse = BaseResponse & {
      pageType: "unknown",

      // the next url to try next based on the user's prompt; for instance,
      // if the user wants to scrape pokemon and there's there's a url marked
      // "list of pokemon" that would be a good candidate. null if there truly
      // are no good guesses (but try to find one)
      guessUrl: string | null; 

      comments: string; // any extra comments that would help in the scraping or clarify previous attributes
    }

${BASE_PROMPT_JSON_INSTRUCTIONS}

Here's the prompt describing what the wants to scrape:

{{prompt}}

Here's the HTML:

{{html}}`,
);
