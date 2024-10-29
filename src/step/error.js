export class StopExecutionError extends Error {
  constructor(msg) {
    super(msg);
    this.name = 'StopExecutionError';
  }
}
