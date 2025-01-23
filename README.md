<div align="center">
  <h1>FetchFox</h1>
  <div>
    <img width="515" alt="Screenshot 2024-10-13 at 1 14 28 AM" src="https://github.com/user-attachments/assets/290d26c5-f0a0-48ba-985a-8052ad23f252">
  </div>

<p>FetchFox is an AI powered scraping, automation, and data extraction library.</p>
  
<p>It can scrape data from any webpage using just plain English. It is made by the developers of the <a href="https://fetchfoxai.com">FetchFox Chrome Extension</a>.</p>
</div>

<div align="center">
  
<a href="https://twitter.com/FetchFoxAI"><img src="https://img.shields.io/twitter/follow/FetchFoxAI?style=social"></a> [![GitHub stars](https://img.shields.io/github/stars/fetchfox/fetchfox.svg?style=social&label=Star)](https://github.com/fetchfox/fetchfox) <a href="https://badge.fury.io/js/fetchfox"><img src="https://badge.fury.io/js/fetchfox.svg" alt="npm version" height="18"></a> <a href="https://discord.gg/mM54bwdu59"><img src="https://img.shields.io/discord/1180618526436888586?label=discord&logo=discord&logoColor=white&style=flat"></a>

</div>

# Getting started

Install the package and playwright:

```bash
npm i fetchfox
npx playwright install-deps
npx playwright install
```

Then use it. Here is the callback style:

```javascript
import { fox } from 'fetchfox';

const results = await fox
  .init('https://pokemondb.net/pokedex/national')
  .extract({ name: 'Pokemon name', number: 'Pokemon number' })
  .limit(3)
  .run(null, (delta) => { console.log(delta.item) });
  
for (const result of results) {
  console.log('Item:', result.item);
}
```

If you prefer, you can use the streaming style:

```javascript
import { fox } from 'fetchfox';

const stream = fox
  .init('https://pokemondb.net/pokedex/national')
  .extract({ name: 'Pokemon name', number: 'Pokemon number' })
  .stream();

for await (const delta of stream) {
  console.log(delta.item);
}
```

Read on below for instructions on how to configure your API key and AI model.

## Enter your API key

You'll need to give an API key for the AI provider you are using, such as OpenAI. There are a few ways to do this.

The easiest option is to set the `OPENAI_API_KEY` environment variable. This will get picked up by the FetchFox library, and all AI calls will go through that key. To use this option, run your code like this:

```bash
OPENAI_API_KEY=sk-your-key node index.js
```

Alternatively, you can pass in your API key in code, like this:

```javascript
import { fox } from 'fetchfox';

const results = await fox
  .config({ ai: { model: 'openai:gpt-4o-mini', apiKey: 'sk-your-key' }})
  .run(`https://news.ycombinator.com/news find links to comments, get basic data, export to out.jsonl`);
```
 
This will use OpenAI's `gpt-4o-mini` model, and the API key you specify. You can pass in other models, including models from other providers like this:

```javascript
const results = await fox
  .config({ ai: { model: 'anthropic:claude-3-5-sonnet-20240620', apiKey: 'your-anthropic-key' }})
  .run(`https://news.ycombinator.com/news find links to comments, get basic data, export to out.jsonl`);
```

Choose the AI model that best suits your needs.

## Start prompting

Easiest is to use a single prompt, like in the example below.

```javascript
import { fox } from 'fetchfox';

const results = await fox.run(
  `https://news.ycombinator.com/news find links to comments, get basic data, export to out.jsonl`);
```

For more control, you can specify the steps like below.

```javascript
import { fox } from 'fetchfox';

const results = await fox
  .init('https://github.com/bitcoin/bitcoin/commits/master')
  .crawl('find links to the comment pages')
  .extract('get the following data: article name, top comment text, top commenter username')
  .schema({ articleName: '', commentText: '', username: '' })
  .export('out.jsonl');
```

You can chain steps to do more complicated scrapes. The example below does the following:

1. Start on the GitHub page for the bitcoin project
2. Find 10 commits
3. Get data bout them including lines of code changed
4. Filter for only the ones that change 10 lines of code
5. Get the authors of those commits, and find the repos those authors commit to

This scrape will take some time, so there is an option to output incremental results.

```javascript
import { fox } from 'fetchfox';

const f = await fox
  .config({ diskCache: '/tmp/fetchfox_cache'  })
  .init('https://github.com/bitcoin/bitcoin/commits/master')
  .crawl('find urls commits, limit: 10')
  .extract('get commit hash, author, and loc changed')
  .filter('commits that changed at least 10 lines')
  .crawl('get urls of the authors of those commits')
  .extract('get username and repos they commit to')
  .schema({ username: 'username', repos: ['array of repos'] });

const results = f.run(null, ({ delta, index }) => {
  console.log(`Got incremental result on step ${index}: ${delta}`);
});
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

## Choosing the right AI model

FetchFox lets you swap in a variety of different AI providers and models. You can check the [src/ai/...](https://github.com/fetchfox/fetchfox/tree/master/src/ai) directory for the list of currently supported providers.

By default, FetchFox uses OpenAI's `gpt-4o-mini` model. We've found this model to provide a good tradeoff between cost, runtime, and accuracy. You can read [more about benchmarking on our blog](https://ortutay.substack.com/p/the-most-accurate-and-cheapest-ai).

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
