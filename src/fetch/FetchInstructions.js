import { PageAction } from "./PageAction.js";

export const FetchInstructions = class {
    constructor(url, actions, options) {
        this.url = url;
        this.actions = actions;
        if (!this.actions || this.actions.length === 0)
            throw new Error('no actions found');
        this.options = options;
    }

    async fetch() {
        const instructions = [];

        for (action in actions) {
            const pageAction = new PageAction(action, options);
            const commands = await pageAction.learn(this.url);
            instructions.push(...commands);
        }

        return instructions;
    }
}