export { ConstStep } from './ConstStep.js';
export { CrawlStep } from './CrawlStep.js';
export { ExportStep } from './ExportStep.js';
export { ExtractStep } from './ExtractStep.js';
export { FetchStep } from './FetchStep.js';

import { ConstStep } from './ConstStep.js';
import { CrawlStep } from './CrawlStep.js';
import { ExportStep } from './ExportStep.js';
import { ExtractStep } from './ExtractStep.js';
import { FetchStep } from './FetchStep.js';

export const classMap = {
  ConstStep,
  CrawlStep,
  ExportStep,
  ExtractStep,
  FetchStep,
};

export const descriptions = [
  {
    name: 'ConstStep',
    description: 'Add a constant item, typically used to initialize the starting URL',
    args: {
      items: {
        description: 'An object to add. Format: array of objects',
        example: [{ url: 'https://example.com' }],
      }
    }
  },

  {
    name: 'CrawlStep',
    description: 'Crawls a URL for links that match a query',
    args: {
      query: {
        description: 'A description of links to look for. Should be specific, and should include exclusions. Format: string',
        example: 'Look for links to user profile pages. Ignore navigation links, links to posts, and advertisements.'
      }
    }
  },

  {
    name: 'ExtractStep',
    description: 'Extract data from a page',
    args: {
      questions: {
        description: 'A list of questions describing the data to extract from a page. Format: array',
        example: ['What is the username of this profile?', 'What is the number of folllowers?', 'What is the bio?', 'What is the URL? Format: Absolute URL'],
      },
      single: {
        description: 'If true, the extraction will find only one item per page. If false, it can find multiple. Should correspond to the users desired number of results per page. Format: boolean',
        example: false
      },
    }
  },

  {
    name: 'ExportStep',
    description: 'Export data to a file',
    args: {
      filename: {
        description: 'Name of the output file. Format: string',
        example: 'out.csv',
      },
      format: {
        description: 'Output format, one of: csv, json, jsonl',
        example: 'csv',
      }
    }
  }
];
