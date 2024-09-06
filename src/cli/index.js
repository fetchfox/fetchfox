#!/usr/bin/env node

import { Command } from 'commander';
import { fetch } from './fetch.js';
import { ask } from './ai.js';

const cmd = new Command();

cmd
  .name('foxtrot')
  .description('AI based web scraping tool');

cmd.command('fetch')
  .description('Fetch a URL')
  .argument('<url>', 'URL to fetch')
  .option('-f --filename <filename>', 'Save the document into a file')
  .action(fetch);

cmd.command('ask')
  .description('Ask AI a question')
  .argument('<prompt>', 'Prompt to send to the AI')
  .option('-p --provider <provider>', 'Which AI provider to use', 'openai')
  .option('-m --model <model>', 'Which model to use', '')
  .option('-k --api-key <api-key>', 'Which model to use', '')
  .action(ask);

cmd.parse();
