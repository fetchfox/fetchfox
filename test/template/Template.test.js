import assert from 'assert';
import process from 'node:process';
import { getAI } from '../../src/index.js';
import { Template } from '../../src/template/Template.js';

describe('Template', function() {

  it('should do capped render of giant string @run', async () => {

    const ai = getAI();

    const template = new Template(
      ['field'],
      `This is a field, Lorem ipsum dolor sit amet {{field}}`);

    const text = `"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum." "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum." "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum." `;

    let field = '';
    while (field.length < 1e8) {
      field += text;
    }

    const context = { field };
    const { prompt } = await template.renderCapped(context, 'field', ai);

    const tokens = await ai.countTokens(prompt);
    assert.ok(tokens < ai.maxTokens);

  });

});
