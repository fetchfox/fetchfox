export const RemoteWorkflow = class {
  constructor() {
    this._stepsInput = [];
    this.steps = [];
  }

  hostname() {
    return this.ctx?.hostname || 'http://fox.fetchfoxai.com:9090';
  }

  url(endpoint) {
    return this.hostname() + endpoint;
  }

  config(args) {
    this.ctx = args;
  }

  async plan(...args) {
    const url = this.url('/plan');
    console.log('plan url:', url);
  }
}
