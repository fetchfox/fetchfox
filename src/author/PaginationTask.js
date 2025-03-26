import { shortObjHash } from '../util.js';
import { BaseTask } from './BaseTask.js';

export const PaginationTask = class extends BaseTask {
  constructor(namespace, options) {
    super(options);
    this.namespace = namespace;
  }

  get goals() {
    return [
      acceptCookiesPrompt,
      nextPagePrompt,
    ];
  }

  get key() {
    const hash = shortObjHash({ questions: this.questions });
    return `pagination-task-${this.namespace}-${hash}`;
  }

  async expected() {
    return `It is expected that pagination took place`;
  }
}

const acceptCookiesPrompt = `Click through any prompts and modals to access the page, like cookie acceptance, age verification, terms of service, or other modals and popups.

This includes any of the following
- Cookie prompts (accept cookie, do not manage unless necessary)
- Age verification terms (agree that you are the required age, eg 21 or older)
- Accepting terms of service in general (accept the terms)
- Closing email subscription popup

This excludes the following:
- Sidebars and navigation tools relevant to the main site

If there are multiple prompts to accept, return one action for each.`;

const nextPagePrompt = `>>> You must provide accurate instructions to get to the next page while following all rules given.

Note: 
- If there are multiple pages linked and a next page button, make sure you click the next page button, not any specific page.
- The next button may have the word next, or some sort of right-arrow like character.
- If you're less confident you may scroll or click a button to Load More data or Show More data.
- The page may be in a foreign language, handle that also

You will know pagination was successful if you see different results on each iteration. The previous results may or may not still be visible, but if you see different results, then pagination completed successfully.

Unless otherwise instructed, your pagination should focus on the *main* content of the page, not extra content or small widgets.`;
