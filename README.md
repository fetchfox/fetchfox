<div align="center">
  <h1>FetchFox</h1>
  <div>
    <img width="515" alt="Screenshot 2024-10-13 at 1 14 28 AM" src="https://github.com/user-attachments/assets/290d26c5-f0a0-48ba-985a-8052ad23f252">
  </div>

<p>FetchFox is an AI powered scraping, automation, and data extraction library.</p>
  
<p>It can scrape data from any webpage using just plain English. It is made by the developers of the <a href="https://fetchfox.ai">FetchFox AI scraper</a>.</p>
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

const workflow = await fox
  .init('https://pokemondb.net/pokedex/national')
  .extract({ name: 'Pokemon name', number: 'Pokemon number' })
  .limit(3)
  .plan();

const results = workflow
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

## Following URLs

You'll often want to scrape over multiple levels. You can do this using the `url` field. If you extract a `url` field, FetchFox will follow that URL on the next step.

For example, you can get HP and attack on the second page of the Pokedex:

```javascript
const workflow = await fox
  .init('https://pokemondb.net/pokedex/national')
  .extract({ 
    url: 'URL of pokemon profile', 
    name: 'Pokemon name', 
    number: 'Pokemon number'
  })
  .extract({ 
    hp: 'Pokemon HP', 
    attack: 'Pokemon attack power', 
  })
  .limit(3)
  .plan();

const results = workflow
  .run(null, (delta) => { console.log(delta.item) });
  
for (const result of results) {
  console.log('Item:', result.item);
}
```

This scraper will start at https://pokemondb.net/pokedex/national, and then go to detail pages like https://pokemondb.net/pokedex/pikachu to get the HP and attack values.

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
  .init('https://pokemondb.net/pokedex/national')
  .extract({ name: 'Pokemon name', number: 'Pokemon number' })
  .limit(3)
  .run();
```
 
This will use OpenAI's `gpt-4o-mini` model, and the API key you specify. You can also use OpenRouter to access AI models from other providers:

```javascript
const results = await fox
  .config({ ai: { model: 'openrouter:google/gemini-flash-1.5', apiKey: 'your-openrouter-key' }})
  .init('https://pokemondb.net/pokedex/national')
  .extract({ name: 'Pokemon name', number: 'Pokemon number' })
  .limit(3)
  .run();
```

Choose the AI model that best suits your needs.

The following providers are supported

* __OpenAI__: Model strings are `openai:...`, for example `openai:gpt-4o`
* __Google__: Model strings are `google:...`, for example `google:gemini-1.5-flash`
* __OpenRouter__: Model strings are `openrouter:...`, for example `openrouter:anthropic/claude-3.5-haiku`


By default, FetchFox uses OpenAI's `gpt-4o-mini` model. We've found this model to provide a good tradeoff between cost, runtime, and accuracy. We have a [public benchmarks dashboard](http://dashboard.fetchfox.ai/) where you can review performance data on recent commits.

