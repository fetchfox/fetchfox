const BASE_PROMPT_INTRO = `
You're part of an AI-powered web crawler.
`;

const BASE_PROMPT_JSON_INSTRUCTIONS = `
Please output JSON, and just the JSON (don't include any text before or after),
because your output will be parsed programmatically. Don't output a code block
either; literally just output the raw JSON text.

Make sure to output VALID JSON. Your response must be parsable by a JSON parser.
`;

const BASE_PROMPT_SCHEMA_INFO = `
The schema format is a JSON object. The keys of the object are the fields, and
the values describe the types. The format of the value should be:

    {
      "description": "<a string describing the field>",
      "type": "<the type of the field>"
    }

Type can be one of the primitive types: string, number, and boolean. For
instance, if we were scraping pokemons, a possible schema would be:

    {
      "name": {
        "description": "The name of the Pokemon",
        "type": "string"
      },
      "weight": {
        "description": "The weight of the Pokemon",
        "type": "number"
      },
      "is_new_generation": {
        "description": "Whether the Pokemon is from the new generation",
        "type": "boolean"
      }
    }

The type can also be an array:

    { "type": "array", "subtype": <a primitive type> }

So for instance, if the user wanted to get a list of all the traits of each
pokemon:

    {
      "traits": {
        "description": "The Pokemon's traits",
        "type": "array",
        "subtype": "string"
      }
    }

Besides arrays, nested types are not allowed, and arrays cannot contain other
arrays.
`;

const SCRAPE_TYPE_PROMPT = `
${BASE_PROMPT_INTRO}

The user has provided a prompt of what he wants to scrape. Your job is to
interpret his request and determine what type of request it is. You can respond
with ONE of the following. Data types are given in pseudo-TypeScript.

1. Fetch many. The user wants to go to a web page and fetch all items of a
certain type. For instance, if we're on a pokemon site and they want to fetch
all the pokemon.

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

{{prompt}}
`;
const GENERATE_SCHEMA_PROMPT = `
${BASE_PROMPT_INTRO}

I'll give you a prompt from the user describing what he wants scraped. Your job
is to interpret it and generate a formal schema.

${BASE_PROMPT_SCHEMA_INFO}

Assume the user is scraping one thing. The root level schema should just be the
thing the user is scraping. For instance, if the user wants to scrape pokemon,
the schema should describe a single pokemon, and the root schema fields should
just be

    {
      "name": ...,
      "weight": ...,
      // whatever else
    }

and NOT:

    {
      "pokemons": {
        "name": ...,
        "weight": ...,
        // whatever else
      }
    }

In other words, do NOT wrap the schema in another object of its own with the
list of things being scraped in its own field.

${BASE_PROMPT_JSON_INSTRUCTIONS}

Here's the user's prompt:

{{prompt}}
`;

const ANALYZE_PAGE_PROMPT = `
${BASE_PROMPT_INTRO}

I'll give you an html page and a prompt from the user describing what he wants
scraped.

Your job is to figure out what kind of page we're currently on. You can respond
with ONE of the following. Data types are given in pseudo-TypeScript.

1. The current page is the "list view." For instance, if we were scraping
pokemon, this would be the page with all the pokemon on it.

    type ListViewResponse = {
      pageType: "list_view";

      // indicates whether all the data the user wants scraped is present on
      // the current page.
      hasAllFields: boolean; 

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
pokemon, this could be the page for a single pokemon like "/pokemon/3".

    type DetailViewResponse = {
      pageType: "detail_view";

      // the url to go back to the general "list view," if it exists
      listViewUrl: string | null;

      // any extra comments that would help in the scraping or clarify previous attributes
      comments: string;
    }

3. The current page is none of the above. A good indication that this is the
case would be if the current page contains no instances of what we're looking
for. But ultimately use your judgment to decide.

    type UnknownResponse = {
      pageType: "unknown",

      guessUrl: string | null; // the next url to try next based on the user's prompt; for instance, if the user wants to scrape pokemon and there's there's a url marked "list of pokemon" that would be a good candidate. null if there truly are no good guesses (but try to find one)

      comments: string; // any extra comments that would help in the scraping or clarify previous attributes
    }

${BASE_PROMPT_JSON_INSTRUCTIONS}

Here's the user's prompt:

{{prompt}}

Here's the HTML:

{{html}}
`;

function tryParseJson(str) {
  try {
    return JSON.parse(str);
  } catch (err) {
    console.log(`invalid json:
===
${str}
===`);
    throw err;
  }
}

const SCRAPE_PAGE_PROMPT = `
${BASE_PROMPT_INTRO}

Your job is to take a page of html and a schema describing what needs to be
scraped, and return the data in the shape of the schema.

${BASE_PROMPT_SCHEMA_INFO}

You should return data in the following format (in pseudo-TypeScript):

    {
      "data": any; // data in the same shape as the schema
      "comments": string; // any extra comments related to the scrape
    }

You should return data in the same shape as the schema, with each
{"description": "...", "type": "..."} replaced with the actual value. If we
were scraping pokemon and you had the schema:

    {
      "name": {
        "description": "the name of the pokemon",
        "type": "string"
      },
      "weight": {
        "description": "the weight of the pokemon in kg",
        "type": "number"
      },
      "traits": {
        "description": "the traits of the pokemon",
        "type": "array"
        "subtype": "string"
      }
    }

You should return

    {
      "data": {
        "name": "Pidgeot",
        "weight": 39.5,
        "traits": ["Normal", "Flying"]
      },
      "comments": "comments here"
    }

(with the real info, of course)

If any fields aren't available on the page, just fill in null.

${BASE_PROMPT_JSON_INSTRUCTIONS}

I'll also tell you whether the desired scrape type is fetch_one, fetch_many, or
either. If it's fetch_one, return a single item. If it's fetch_many, return
multiple. If it's either, use your judgment to see what should be done. In any
case, return a JSON array of objects. Even for fetch_one, just return an array
containing the single object. If you can't find anything, return an empty array.

The scrape type is: {{scrapeType}}

The schema is:

{{schema}}

The html is:

{{html}}
`;
