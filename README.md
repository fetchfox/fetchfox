<div align="center">
  <h1>FoxTrot</h1>
  <div><img width="400" alt="FoxTrot is an AI powered scraping library" src="https://github.com/user-attachments/assets/44c3731f-b919-4b82-89ae-c64cfd302f0f"></div>
  
  <p>FoxTrot is an AI powered scraping, automation, and data extraction library.</p>
  
  <p>It can scrape data from any webpage using just plain English. It is made by the developers of the [FetchFox Chrome](https://fetchfoxai.com) Extension</a>.</p>
</div>

<div align="center">
  
<a href="https://twitter.com/FetchFoxAI"><img src="https://img.shields.io/twitter/follow/FetchFoxAI?style=social"></a> [![GitHub stars](https://img.shields.io/github/stars/fetchfox/foxtrot.svg?style=social&label=Star)](https://github.com/fetchfox/foxtrot) <a href="https://badge.fury.io/js/foxtrot-ai"><img src="https://badge.fury.io/js/foxtrot-ai.svg" alt="npm version" height="18"></a> <a href="https://discord.gg/mM54bwdu59"><img src="https://img.shields.io/discord/1180618526436888586?label=discord&logo=discord&logoColor=white&style=flat"></a>

</div>

# Usage

Install the package:

```bash
npm i foxtrot-ai
```
# Example

Use the npm package in Javascript:

```javascript
import {
  Crawler,
  getAi,
  BasicExtractor,
} from 'foxtrot-ai';

const ai = getAi('openai:gpt-4o-mini');
const crawler = new Crawler(ai);
const extractor = new BasicExtractor(ai)

const url = 'https://news.ycombinator.com';
for await (const { link } of crawler.stream(url, 'comment links')) {
  const questions = [
    'what is the author of this comment?',
    'summarize the comment in 5 words'];
  for await (const { item } of extractor.stream(link.url, questions)) {
  }
}
```

Or use the command line tool:

![cli](https://github.com/user-attachments/assets/50e07613-7d31-4405-9c11-fe70febee0f7)
