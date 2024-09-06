#!/usr/bin/env node

import { Command } from 'commander';
import { fetch } from './fetch.js';

const cmd = new Command();

cmd
  .name('foxtrot')
  .description('AI based web scraping tool');

cmd.command('fetch')
  .description('Fetch a URL')
  .argument('<url>', 'URL to fetch')
  .option('-s --save <filename>', 'Save the document into a file')
  .action(fetch);

cmd.parse();
