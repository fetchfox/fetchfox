import { BaseStep } from './BaseStep.js';
import { Author, ActionTask } from '../author/index.js';

export const ActionStep = class extends BaseStep {
  constructor(args) {
    // TODO: fetcher pool system for pw concurrency
    super({ ...args, concurrency: 8 });
    this.commands = args.commands;
  }

  async process({ cursor, item, index }, cb) {
    const url = item.url || item._url;

    const namespace = new URL(url).host;
    const author = new Author({ ...cursor.ctx, timeout: 45 * 60 * 1000 });

    const task = new ActionTask(namespace, this.commands.map(it => it.prompt));
    const urls = [url];
    const { script } = await author.get(task, urls);
    cursor.handleArtifact(
      { type: 'code', data: { script: JSON.parse(script.dump()) } },
      index);

    // runCb returns true when task execution should stop
    let done;
    const runCb = () => {
      return !done;
    }

    const gen = author.run(task, urls, { cb: runCb });
    for await (const r of gen) {
      done = cb(r.doc);
      if (done) break;
    }

    done = true;
  }
}
