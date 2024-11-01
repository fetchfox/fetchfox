import { logger } from '../log/logger.js';
import { Client } from './Client.js';
import { Document } from '../document/Document.js';

export const ChromeRelayActor = class {
  constructor(host) {
    this.client = new Client(host, { reconnect: true });
  }

  async connect(id) {
    this.id = await this.client.connect(id);
    this.client.listen(async (data) => {
      const reply = await this.act(data);
      logger.debug(`Actor returning reply ${JSON.stringify(reply).substr(0, 120)}`);
      return reply;
    });
    return this.id;
  }

  act(data) {
    logger.info(`Chrome relay actor got: ${JSON.stringify(data)}`);
    if (data.command == 'fetch') {
      return this.fetch(data);
    } else {
      throw new Error(`Unhandled command ${JSON.stringify(data)}`);
    }
  }

  async fetch(data) {
    const url = data.url;

    logger.debug(`Chrome relay actor got url: ${url}`);

    const { tab, details } = await new Promise(ok => chrome.tabs.create(
      { url, active: data.active },
      (tab) => {
        chrome.webRequest.onCompleted.addListener(
          (details) => {
            if (details.tabId == tab.id) {
              ok({ tab, details });
            }
          },
          { urls: [url] }
        );
      })
    );

    try {
      logger.debug(`Got details for ${tab.id}: ${JSON.stringify(details)}`);

      const result = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        injectImmediately: true,
        args: [2000],
        func: injectFunction,
      });

      if (
        !result ||
        !result.length ||
        result.length == 0 ||
        !result[0].result
      ) {
        return;
      }

      const data = result[0].result;
      data.resp.status = details.statusCode;
      data.resp.statusText = details.statusLine;

      const doc = new Document();
      doc.loadData(data);
      doc.parse();
      return doc.dump();

    } finally {
      chrome.tabs.remove(tab.id);
    }
  }
}

const injectFunction = async (waitTime) => {
  await new Promise(ok => setTimeout(ok, waitTime));
  return {
    url: document.location.href,
    body: document.documentElement.outerHTML,
    resp: {
      headers: {'content-type': 'text/html'},
    },
  };
}
