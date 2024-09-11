# FoxTrot

FoxTrot is an AI powered scraping library.

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
