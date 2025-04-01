import { logger as defaultLogger } from "../log/logger.js";
import { getFetcher } from '../fetch/index.js';
import { getKV } from '../kv/index.js';
import { getAI } from '../ai/index.js';
import { Author, ActionTask } from '../author/index.js';

export const CodeInstructions = class {
  constructor(url, commands, options) {
    this.url = url;
    this.commands = commands;
    this.cache = options?.cache;
    this.signal = options?.signal;
    this.fetcher = options?.fetcher || getFetcher(
      null,
      { cache: this.cache, signal: this.signal });
    this.ai = options?.ai || getAI(
      null,
      { cache: this.cache, signal: this.signal });
    this.kv = options?.kv || getKV();
    this.timeout = options?.timeout || this.fetcher.timeout || 60000;
    this.limit = options?.limit;
    this.hint = options?.hint;
    this.logger = options?.logger || defaultLogger
    this.onArtifact = options?.onArtifact;
  }

  toString() {
    return `[${this.constructor.name}]`;
  }

  async *learn() {
    // no-op
  }

  async *execute() {
    this.logger.info(`${this} Execute code instructions`);

    const author = new Author({
      fetcher: this.fetcher,
      kv: this.kv,
      ai: this.ai,
      cache: this.cache,
      logger: this.logger,
      timeout: this.timeout,
    });

    const namespace = new URL(this.url).host;

    // TODO: special case pagination tasks?

    const goals = [];
    for (const command of this.commands) {
      goals.push(command.prompt);
    }

    const task = new ActionTask(namespace, goals);

    const urls = [this.url];
    const { script } = await author.get(task, urls);
    if (this.onArtifact) {
      this.onArtifact({ type: 'code', data: { script: JSON.parse(script.dump()) } });
    }

    const gen = author.run(task, urls);
    for await (const r of gen) {
      yield Promise.resolve(r);
    }
  }
}
