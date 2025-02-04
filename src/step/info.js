export const nameMap = {
  ConstStep: 'const',
  CrawlStep: 'crawl',
  DeepCrawlStep: 'deepcrawl',
  ExtractStep: 'extract',
  ActionStep: 'action',
  FetchStep: 'fetch',
  FilterStep: 'filter',
  LimitStep: 'limit',
  SchemaStep: 'schema',
  UniqueStep: 'unique',
};

const combineInfo = (info) => {
  const combined = { ...info };
  combined.args.limit = {
    description: 'Limit the number of results in this step.',
    format: 'number',
    example: 5,
    required: false,
  };

  if (['const', 'extract', 'crawl', 'fetch'].includes(info.name)) {
    combined.args.maxPages = {
      description: 'Max number of pages to fetch from source URLs',
      format: 'number',
      required: false,
      default: 1,
    };
  }

  return combined;
};

export const stepDescriptionsMap = {
  crawl: combineInfo({
    name: 'crawl',
    description: 'Crawls a URL for links that match a query',
    args: {
      query: {
        description: 'A description of links to look for. Should be specific, and should include exclusions.',
        format: 'string',
        example: 'Look for links to user profile pages. Ignore navigation links, links to posts, and advertisements.',
        required: true,
      },
      css: {
        description: 'A CSS selector, if present we will look only in this section',
        format: 'string',
        required: false,
      },
    },
  }),

  deepcrawl: combineInfo({
    name: 'deepcrawl',
    hideFromAI: true, // beta
    description: 'Deep crawls a URL for links that match a query',
    args: {
      query: {
        description: 'A high-level prompt describing what you want to scrape.',
        format: 'string',
        example: 'Scrape pokemon and get their name, weight and traits.',
        required: true,
      },
    },
  }),

  const: combineInfo({
    name: 'const',
    description: 'Add a constant item, typically used to initialize the starting URL',
    args: {
      items: {
        description: 'An array of objects to add.',
        format: 'array',
        example: [{ url: 'https://example.com' }],
        required: true,
      },
    },
  }),

  extract: combineInfo({
    name: 'extract',
    description: 'Extract data from a page.',
    args: {
      questions: {
        description:
          'A dictionary of questions describing the data to extract from a page. They keys are the field names, and the values are the questions describing what to extract.',
        format: 'object',
        example: {
          username: 'What is the username of this profile?',
          followers: 'What is the number of followers?',
          bio: 'What is the bio?',
          url: 'What is the URL? Format: Absolute URL',
        },
        required: true,
      },
      single: {
        description:
          'If true, the extraction will find only one item per page. If false, it can find multiple. Typically, if there is a "crawl" step before extraction, you will want single=true, and if there is no "crawl" step you will want single=false',
        format: 'boolean',
        example: true,
        required: false,
      },

      // TODO: move this elsewhere
      examples: {},
    },
  }),

  fetch: combineInfo({
    // The AI shouldn't need to fetch manually
    hideFromAI: true,

    name: 'fetch',
    description: 'Fetch URLs from the web',
    args: {
      urlFields: {
        description: 'Which fields to use as the URL(s) we are fetching',
        format: 'array',
        example: ['url', 'companyUrl'],
        required: false,
        default: ['url'],
      },
      waitForText: {
        description: 'Text to wait for which indicates the page is loaded',
        format: 'string',
        required: false,
      },
      active: {
        description: 'Open URLs in active tab on Chrome',
        format: 'boolean',
        required: false,
      },
      css: {
        description: 'A CSS selector that narrows which part of the page to return',
        format: 'string',
        required: false,
      },
    },
  }),

  action: combineInfo({
    // The AI isn't smart enough to use this step
    hideFromAI: true,

    name: 'action',
    description: 'Performn an action on the page',
    args: {
      commands: {
        description: 'List of commands to perform on this page',
        format: 'array',
        example: ['Go through all the pages using next page', 'Click on each profile icon'],
        required: true,
      },
    },
  }),

  filter: combineInfo({
    name: 'filter',
    description: 'Filter results based on a user prompt',
    args: {
      query: {
        description: 'A description of what to filter from.',
        format: 'string',
        example:
          'Look only for articles relating to technology and business. Ignore anything written more than a week ago.',
        required: true,
      },
    },
  }),

  limit: combineInfo({
    name: 'limit',
    description: 'Limit the number of results',
    args: {},
  }),

  schema: combineInfo({
    hideFromAI: true,
    name: 'schema',
    description: 'Reformat items into a target schema',
    args: {
      schema: {
        description: 'The desired target schema',
        format: 'object',
        example: '{"title": "article title", "authors": ["list of authors..."]}',
        required: true,
      },
    },
  }),

  unique: combineInfo({
    name: 'unique',
    description:
      'Keep only unique items on the basis of a praticular field, or the entire item if no field is specified',
    args: {
      fields: {
        description:
          'Fields to ouse for making results unique. Can be one or more. Leave blank to use all fields on every object.',
        format: 'array',
        example: ['username', 'subject'],
        required: false,
      },
    },
  }),
};

export const stepDescriptions = Object.values(stepDescriptionsMap);
export const stepNames = Object.keys(stepDescriptionsMap);
