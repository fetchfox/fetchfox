import assert from 'assert';
import process from 'node:process';
import { logger } from '../../src/log/logger.js';
import { parseAnswer } from '../../src/ai/util.js';
import { testCache, setTestTimeout } from '../lib/util.js';

describe('util', function() {

  it('should parse jsonl @fast', async () => {
    const cases = [
      // Basic
      [
        `{"key":123}`,
        [
          { key: 123 }
        ],
      ],

      // Two lines
      [
        `{"key1":123}
{"key2":456}
`,
        [
          { key1: 123 },
          { key2: 456 },
        ],
      ],

      // Incomplete line
      [
        `{"key1":123}
{"key2":456
`,
        [
          { key1: 123 },
        ],
      ],

      // Nested + incomplete
      [
        `{"key1":{"nested":"abc"}}
{"key2":456
`,
        [
          { key1: { nested: 'abc' } },
        ],
      ],

      // Many nested + incomplete
      [
        `{"key":{"nested":"abc"}}
{"key":{"nested":"xyz"}}
{"key":{"nested":"zzz", "another":{"array":[1,2,3]}}}
{"key":456
`,
        [
          { key: { nested: 'abc' } },
          { key: { nested: 'xyz' } },
          { key: { nested: 'zzz', another: { array: [1, 2, 3] } } },
        ],
      ],

      // Markdown
      [
        `\`\`\`jsonl
{"key":123}
\`\`\``,
        [
          { key: 123 },
        ],
      ],

      // Incomplete markdown
      [
        `\`\`\`jsonl
{"key":111}
{"key":222}
{"key":33
\`\`\``,
        [
          { key: 111 },
          { key: 222 },
        ],
      ],

      // Tail markdown
      [
        `{"key":222}
{"key":333}
\`\`\``,
        [
          { key: 222 },
          { key: 333 },
        ],
      ],
    ];

    for (const [input, expected] of cases) {
      const actual = parseAnswer(input, 'jsonl').result;
      assert.equal(JSON.stringify(actual), JSON.stringify(expected));
    }
  });

});
