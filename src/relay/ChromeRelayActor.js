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

    const [
      activeTab,
      tabWithUrl
    ] = await Promise.all([
      getActiveTab(),
      getTabWithUrl(url),
    ]);

    let tab;
    let status;
    let shouldClose;

    if (activeTab && activeTab.url == url) {
      logger.debug(`Chrome relay actor found active tab ${activeTab.id}`);
      tab = activeTab;
      status = 200;
      shouldClose = false;

    } else if (tabWithUrl) {
      logger.debug(`Chrome relay actor found tab with matching URL ${tabWithUrl.id}`);
      tab = tabWithUrl;
      status = 200;
      shouldClose = false;

    } else {
      logger.debug(`Chrome relay actor opening new tab`);
      const resp = await new Promise(ok => chrome.tabs.create(
        { url, active: !!data.active },
        // { url, active: false },
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

      tab = resp.tab;
      status = resp.details.statusCode;
      shouldClose = true;
    }

    try {
      logger.debug(`Got status for ${tab.id}: ${status}`);

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
      data.resp.status = status;

      const doc = new Document();
      doc.loadData(data);
      doc.parse();

      logger.debug(`Loaded document ${doc}`);

      return doc.dump();

    } finally {
      if (shouldClose) {
        logger.debug(`Chrome relay actor closing tab ${tab.id}`);
        chrome.tabs.remove(tab.id);
      }
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

const getActiveTab = async () => {
  return new Promise((ok) => {
    chrome.tabs.query(
      { active: true },
      (tabs) => ok(tabs[0] ? tabs[0] : null));
  });
}

const getTabWithUrl = async (url) => {
  let u = new URL(url);
  // Query without hash
  const noHash = url.replace(u.hash, '');
  return new Promise((ok) => {
    chrome.tabs.query(
      { url: noHash },
      (tabs) => {
        console.log('lll got tabs after query', url, tabs);
        // Check for hash match
        for (let tab of (tabs || [])) {
          if (tab.url == url) ok(tab);
        }
        ok(null);
      });
  });
}
