#!/usr/bin/env node

import { Command } from 'commander';

import { logger } from '../log/logger.js';
import { fetch } from './fetch.js';
import { ask } from './ai.js';
import { crawl } from './crawl.js';
import { extract } from './extract.js';

Command.prototype.fetcherOptions = function () {
  return this
    .option('-f --fetcher <fetcher>', 'Which fetcher to use', 'fetch');
}

Command.prototype.extractorOptions = function () {
  return this
    .option('-e --extractor <extractor>', 'Which extractor to use', 'single-prompt');
}

Command.prototype.aiOptions = function () {
  return this
    .option('-a --ai <ai>', 'Which AI to use, syntax is provider:model', 'openai:gpt-4o-mini')
    .option('-k --api-key <api-key>', 'Provider API key', '');
}

Command.prototype.globalOptions = function () {
  return this
    .option('--cache <path>', 'Cache prompts and fetches in this directory')
    .option('-v --verbose', 'Verbose output');
}

Command.prototype.wrappedAction = function (fn) {
  return this.action((...args) => {
    const { verbose } = args[args.length - 2];
    if (verbose) {
      logger.transports.forEach((transport) => {
        if (transport) {
          transport.level = 'info';
        }
      });
    }
    fn(...args);
  });
}

const cmd = new Command();

cmd.command('fetch')
  .description('Fetch a URL')
  .argument('<url>', 'URL to fetch')
  .globalOptions()
  .fetcherOptions()
  .option('-s --save <filename>', 'Save the document into a file')
  .wrappedAction(fetch);

cmd.command('ask')
  .description('Ask AI a question')
  .argument('<prompt>', 'Prompt to send to the AI')
  .globalOptions()
  .aiOptions()
  .option('-s --stream', 'Stream output')
  .wrappedAction(ask);

cmd.command('crawl')
  .description('Crawl a URL for links related to a prompt')
  .argument('<url>', 'URL to crawl')
  .argument('<prompt>', 'Prompt for what kind of links to look for')
  .globalOptions()
  .fetcherOptions()
  .aiOptions()
  .wrappedAction(crawl);

cmd.command('extract')
  .description('Extract item from a given URL')
  .argument('<url>', 'URL to extract')
  .argument('<fields>', 'Fields of the item to extract, comma separated')
  .globalOptions()
  .fetcherOptions()
  .extractorOptions()
  .aiOptions()
  .option('-l --limit <limit>', 'Max number of items to extract')
  .option('-i --item <description>', 'Description of the item your are looking for')
  .option('-s --save <filename>', 'Save extracted items to a file')
  .option('-S --save-source', 'Save source document')
  .option('-F --format <format>', 'Output format (json, jsonl)', 'json')
  .wrappedAction(extract);

cmd.parse();
