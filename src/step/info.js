export const nameMap = {
  ActionStep: 'action',
  ConstStep: 'const',
  CrawlStep: 'crawl',
  ExportItemsStep: 'exportItems',
  ExportURLsStep: 'exportURLs',
  ExtractStep: 'extract',
  FetchStep: 'fetch',
  FilterStep: 'filter',
  LimitStep: 'limit',
  LoginStep: 'login',
  SchemaStep: 'schema',
  UniqueStep: 'unique',
};

const combineInfo = (info) => {
  const combined = {...info};
  combined.args.limit = {
    description: 'Limit the number of results in this step.',
    format: 'number',
    example: 5,
    required: false,
  };
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
    },
  }),

  action: combineInfo({
    // This step is hard for AI to configure, so don't show it for now
    hideFromAI: true,

    name: 'action',
    description: 'Perform some action on the page, such as clicking buttons',
    args: {
      action: {},
      query: {},
      selector: {},

      // actions: {
      //   description: `A list of actions to take on the page. Each action is an array of three items. The first item is the action to take, eg. 'click'. The second item is a description of the target of this action, eg. 'all the download buttons on the page. The third item is an optional CSS selector, to narrow the range of elements searched.'`,
      //   format: 'array',
      //   example: ['click', 'the next page button', 'button.cta'],
      //   required: true,
      // },
    },
  }),

  'const': combineInfo({
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

  exportItems: combineInfo({
    hideFromAI: true,
    name: 'exportItems',
    description: 'Exports the entire item result array into a file or cloud service. Only include this step if an export is specifically requested.',
    args: {
      filepath: {
        description: 'Path of the output file, including filenames. For s3, this is the KEY only, and does NOT include the bucket.',
        format: 'string',
        example: 'outputs/out.csv',
        required: true,
      },
      format: {
        description: 'Output format, one of: csv, json, jsonl',
        format: 'string',
        options: ['csv', 'json', 'jsonl'],
        example: 'csv',
        default: 'jsonl',
        required: false,
      },
      destination: {
        description: `The user's destination for the output`,
        format: 'string',
        options: ['s3', 'dropbox', 'file'],
        example: 'dropbox',
        default: 'file',
        required: false,
      },
      s3bucket: {
        description: `If destionation=s3, what is the bucket name. Leave empty if none can be inferred, since it may be in the user's env variables.`,
        format: 'string',
        example: 'my-s3-bucket',
        required: false,
      },
    },
  }),

  exportURLs: combineInfo({
    name: 'exportURLs',
    description: `Get URLs from a specific field of the items, render those URLs into PDF, and export them into a file or cloud service. Only include if specifically requested.`,
    args: {
      field: {
        description: `The item field containing the target URL. The value here MUST be an EXACT string from a previous 'extract' or 'schema' step`,
        format: 'string',
        example: 'What is the URL of the linked article? Format: Absolute URL',
        required: true,
      },
      format: {
        description: `The user's desired output format`,
        format: 'choices',
        choices: ['pdf'],
        example: 'pdf',
        default: 'pdf',
        required: true,
      },
      destination: {
        description: `The user's destination for the output. Use absolute path, starting with /`,
        format: 'choices',
        choices: ['s3', 'dropbox', 'google', 'file'],
        default: 's3',
        example: 'dropbox',
        required: true,
      },
      s3bucket: {
        description: `If destionation=s3, what is the bucket name. Leave empty if none can be inferred, since it may be in the user's env variables.`,
        format: 'string',
        example: 'my-s3-bucket',
        required: false,
      },
      filename: {
        description: `Filename template of the output files. Template may use {url} as part of the filename, which will differentiate the various rendered URLs`,
        format: 'string',
        example: 'article-{url}.pdf',
        default: '{url}.pdf',
        required: true,
      },
      directory: {
        description: `Directory of the output files. Template may use {url} as part of the filename, which will differentiate the various rendered URLs`,
        format: 'string',
        example: 'output/',
        default: '',
        required: true,
      },
    },
  }),

  extract: combineInfo({
    name: 'extract',
    description: 'Extract data from a page.',
    args: {
      questions: {
        description: 'A dictionary of questions describing the data to extract from a page. They keys are the field names, and the values are the questions describing what to extract.',
        format: 'object',
        example: { username: 'What is the username of this profile?', followers: 'What is the number of followers?', bio: 'What is the bio?', url: 'What is the URL? Format: Absolute URL' },
        required: true,
      },
      single: {
        description: 'If true, the extraction will find only one item per page. If false, it can find multiple. Typically, if there is a "crawl" step before extraction, you will want single=true, and if there is no "crawl" step you will want single=false',
        format: 'boolean',
        example: true,
        required: false,
      },
    },
  }),

  fetch: combineInfo({
    // The AI shouldn't need to fetch manually
    hideFromAI: true,

    name: 'fetch',
    description: 'Fetch URLs from the web',
    args: {},
  }),

  filter: combineInfo({
    name: 'filter',
    description: 'Filter results based on a user prompt',
    args: {
      query: {
        description: 'A description of what to filter from.',
        format: 'string',
        example: 'Look only for articles relating to technology and business. Ignore anything written more than a week ago.',
        required: true,
      },
    },
  }),

  limit: combineInfo({
    name: 'limit',
    description: 'Limit the number of results',
    args: {},
  }),

  login: combineInfo({
    hideFromAI: true,
    name: 'login',
    description: 'Log in using username and password',
    args: {
      username: {
        description: 'Username to use for login.',
        format: 'string',
        example: 'email@example.com',
        required: true,
      },
      password: {
        description: 'Password to use for login.',
        format: 'string',
        example: 'password123',
        required: true,
      },
    },
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
    description: 'Keep only unique items on the basis of a praticular field, or the entire item if no field is specified',
    args: {
      fields: {
        description: 'Fields to ouse for making results unique. Can be one or more. Leave blank to use all fields on every object.',
        format: 'array',
        example: ['username', 'subject'],
        required: false,
      },
    },
  }),
};

export const stepDescriptions = Object.values(stepDescriptionsMap);
export const stepNames = Object.keys(stepDescriptionsMap);
