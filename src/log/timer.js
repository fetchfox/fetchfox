import chalk from 'chalk';
import { logger } from './logger.js';

// Usage:
//
//  - timer.push('name') to start a new timer scope
//    timer.pop() to leave the scope
//    Nested scopes are supported and will be indented in the output.
//
//  - timer.withScope('name', () => { ... }) is convenience fn that autowraps in push/pop.
//    timer.withScopeGen('name', this, async function* () { ... }); for generator functions.
//
//  - timer.log('...') to print time elapsed since last log (or scope start).
//    timer.total() to print time elapsed since scope start. This is done automatically on pop.
//
// We export a singleton `timer` from this file, which should be good enough
// for nearly all use cases, but you can also instantiate your own Timer object.

export class Timer {
  constructor() {
    this.scopes = [];
  }

  push(name) {
    const scope = this.topScope();
    const depth = scope ? scope.depth + 1 : 0;
    this.scopes.push(new TimerScope(name, depth));
  }

  async *withScopeGen(name, self, fn) {
    this.push(name);
    try {
      yield* fn.bind(self)(this);
    } finally {
      this.pop();
    }
  }

  async withScope(name, fn) {
    this.push(name);
    try {
      return await fn(this);
    } finally {
      this.pop();
    }
  }

  topScope() {
    if (!this.scopes.length) return null;
    return this.scopes[this.scopes.length - 1];
  }

  pop() {
    this.total();
    this.scopes.pop();
  }

  log = (s) => this.topScope()?.log(s);
  total = () => this.topScope()?.total();
}

class TimerScope {
  constructor(name, depth) {
    this.name = name;
    this.depth = depth;

    const now = performance.now();
    this.start = now;
    this.time = now;
  }

  logString(s, level = 'debug') {
    const indentation = '    '.repeat(this.depth);
    const name = this.name ?? '<unnamed>';
    const output = `${indentation}[${name}] ${s}`;

    logger[level](output);
  }

  formatDelta(delta) {
    const output = `${delta.toFixed(0)}ms`;
    return delta >= 1000 ? chalk.red(output) : output;
  }

  log(s) {
    const now = performance.now();
    const delta = now - this.time;
    this.time = now;

    this.logString(`${s} ${this.formatDelta(delta)}`);
  }

  total() {
    const now = performance.now();
    const delta = now - this.start;
    this.time = now;

    this.logString(`Total: ${this.formatDelta(delta)}`);
  }
}

export const timer = new Timer();
