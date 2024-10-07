<div align="center">
  <h1>FetchFox</h1>
  <div><img width="400" alt="FetchFox is an AI powered scraping library" src="https://github.com/user-attachments/assets/44c3731f-b919-4b82-89ae-c64cfd302f0f"></div>

<p>FetchFox is an AI powered scraping, automation, and data extraction library.</p>
  
<p>It can scrape data from any webpage using just plain English. It is made by the developers of the <a href="https://fetchfoxai.com">FetchFox Chrome Extension</a>.</p>
</div>

<div align="center">
  
<a href="https://twitter.com/FetchFoxAI"><img src="https://img.shields.io/twitter/follow/FetchFoxAI?style=social"></a> [![GitHub stars](https://img.shields.io/github/stars/fetchfox/fetchfox.svg?style=social&label=Star)](https://github.com/fetchfox/fetchfox) <a href="https://badge.fury.io/js/fetchfox"><img src="https://badge.fury.io/js/fetchfox.svg" alt="npm version" height="18"></a> <a href="https://discord.gg/mM54bwdu59"><img src="https://img.shields.io/discord/1180618526436888586?label=discord&logo=discord&logoColor=white&style=flat"></a>

</div>

# Usage

Install the package:

```bash
npm i fetchfox
```
# Example

Use the npm package in Javascript:

Easiest is to use a single prompt.

```javascript
import { fox } from 'fetchfox';

await fox.run(`https://news.ycombinator.com/news find links to comments, get basic data, export to out3.jsonl`);
```

For more control, you can specify one prompt per step.

```javascript
import { fox } from 'fetchfox';

await fox.run(
  'https://news.ycombinator.com/news',
  'find links to comments',
  'find the usernames of the commenters',
  'get their bio',
  'export to out2.jsonl');
```

The library is modular, and you can use the component individually.

```javascript
import { Crawler, SinglePromptExtractor } from 'fetchfox';

const ai = 'openai:gpt-4o-mini';
const crawler = new Crawler({ ai });
const extractor = new SinglePromptExtractor({ ai });

const url = 'https://news.ycombinator.com';
const questions = [
  'what is the article title?',
  'how many points does this submission have? only number',
  'how many comments does this submission have? only number',
  'when was this article submitted? convert to YYYY-MM-DD HH:mm{am/pm} format',
];

for await (const link of crawler.stream(url, 'comment links')) {
  console.log('Extract from:', link.url);
  for await (const item of extractor.stream(link.url, questions)) {
    console.log(item);
  }
}
```

# CLI

Or use the command line tool. Install it:

```bash
npm install -g fetchfox
```

And then run the `extract` command:

```bash
fetchfox extract https://www.npmjs.com/package/@tinyhttp/cookie \
  'what is the package name?,what is the version number?,who is the main author?'
```

Or use `npx` instead:

```bash
npx fetchfox extract https://www.npmjs.com/package/@tinyhttp/cookie \
  'what is the package name?,what is the version number?,who is the main author?'
```


![cli](https://github.com/user-attachments/assets/50e07613-7d31-4405-9c11-fe70febee0f7)
