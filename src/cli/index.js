#!/usr/bin/env node

import { Command } from 'commander';

import { logger } from '../log/logger.js';
import { fetch } from './fetch.js';
import { ask } from './ai.js';
import { crawl } from './crawl.js';

Command.prototype.fetcherOptions = function () {
  return this
    .option('-f --fetcher', 'Which fetcher to use', 'fetch');
}

Command.prototype.aiOptions = function () {
  return this
    .option('-p --provider <provider>', 'Which AI provider to use', 'openai')
    .option('-m --model <model>', 'Which model to use', '')
    .option('-k --api-key <api-key>', 'Provider API key', '');
}

Command.prototype.verbosityOptions = function () {
  return this
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
  .verbosityOptions()
  .fetcherOptions()
  .option('-s --save <filename>', 'Save the document into a file')
  .wrappedAction(fetch);

cmd.command('ask')
  .description('Ask AI a question')
  .argument('<prompt>', 'Prompt to send to the AI')
  .verbosityOptions()
  .aiOptions()
  .wrappedAction(ask);

cmd.command('crawl')
  .description('Crawl a URL for links related to a prompt')
  .argument('<url>', 'URL to crawl')
  .argument('<prompt>', 'Prompt for what kind of links to look for')
  .verbosityOptions()
  .fetcherOptions()
  .aiOptions()
  .wrappedAction(crawl);

cmd.parse();
