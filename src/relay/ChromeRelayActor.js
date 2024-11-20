import { logger } from '../log/logger.js';
import { Client } from './Client.js';
import { Document } from '../document/Document.js';
import { TagRemovingMinimizer } from '../min/TagRemovingMinimizer.js';

export const ChromeRelayActor = class {
  constructor(host, options) {
    host = host.replace(/^http/, 'ws');
    this.client = new Client(host, { reconnect: true, shouldReply: true });
    this.requestCompletedTimeout = options?.requestCompletedTimeout || 5000;
  }

  async connect(id) {
    this.id = await this.client.connect(id);
    this.client.listen(async (data) => {
      if (data.command == 'pong') {
        return;
      }
      const reply = await this.act(data);
      logger.debug(`Actor returning reply ${JSON.stringify(reply).substr(0, 120)}`);
      return reply;
    });
    return this.id;
  }

  async ping(cb) {
    this.client.ping(cb);
  }

  async act(data) {
    const start = (new Date()).getTime();
    try {
      logger.info(`Chrome relay actor got: ${JSON.stringify(data)}`);
      if (data.command == 'fetch') {
        const out = await this.fetch(data);
        return out;
      } else {
        throw new Error(`Unhandled command ${JSON.stringify(data)}`);
      }
    } finally {
      const took = (new Date()).getTime() - start;
      logger.debug(`Chrome relay actor end-to-end took ${took} msec`);
    }
  }

  async fetch(data) {
    const {
      url,
      presignedUrl,
      waitForText,
      removeTags,
    } = data;
    const active = !!data.active;

    logger.debug(`Chrome relay actor fetching url: ${url}, with waitForText=${waitForText}`);

    const start1 = (new Date()).getTime();
    const [
      activeTab,
      tabWithUrl
    ] = await Promise.all([
      getActiveTab(),
      getTabWithUrl(url),
    ]);
    const took1 = (new Date()).getTime() - start1;
    logger.debug(`took1=${took1}`);

    let tab;
    let status;
    let shouldClose;

    logger.debug(`Got active tab: ${activeTab?.url}`);
    logger.debug(`Got tab with URL: ${tabWithUrl}`);

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

      const start2 = (new Date()).getTime();
      const resp = await new Promise(ok => chrome.tabs.create(
        { url, active },
        (tab) => {
          setTimeout(
            async () => {
              logger.warn(`Request completed timeout hit on tab=${tab.id} url={url}`);
              ok({ tab, details: { statusCode: 200 } });
            },
            this.requestCompletedTimeout);

          chrome.webRequest.onCompleted.addListener(
            (details) => {
              logger.info(`Request completed success on tab=${tab.id} url={url}`);
              if (details.tabId == tab.id) {
                ok({ tab, details });
              }
            },
            { urls: [url] }
          );
        })
      );
      const took2 = (new Date()).getTime() - start2;
      logger.debug(`create took2=${took2}`);

      tab = resp.tab;
      status = resp.details.statusCode;
      shouldClose = true;
    }

    try {
      const start = (new Date()).getTime();
      logger.debug(`Got status for ${tab.id}: ${status}, loading: ${waitForText}`);
      let doc = await getDocumentFromTab(tab.id, status, 2000, waitForText);
      const tookLoad = (new Date()).getTime() - start;
      logger.debug(`Loaded document ${doc}, presignedUrl=${presignedUrl}, took=${tookLoad} msec`);

      if (removeTags) {
        const start = (new Date()).getTime();
        logger.debug(`Minimize doc before returning`);
        const minimizer = new TagRemovingMinimizer({ removeTags });
        doc = await minimizer.min(doc);
        const tookMin = (new Date()).getTime() - start;
        logger.debug(`Minimized ${doc}, took=${tookMin} msec`);
      }

      return doc.dump({ presignedUrl });

    } finally {
      if (shouldClose) {
        logger.debug(`Chrome relay actor closing tab ${tab.id}`);
        chrome.tabs.remove(tab.id);
      }
    }
  }
}

const injectFunction = async (waitTime, waitForText) => {
  if (waitForText) {
    const timeout = 30000;
    const interval = 100;

    await new Promise((ok) => {
      const startTime = Date.now();
      const id = setInterval(() => {
        const text = document.body.innerText;
        if (text.includes(waitForText)) {
          clearInterval(id);
          ok();
          return;
        }

        if (Date.now() - startTime > timeout) {
          clearInterval(id);
          console.error(`Timeout waiting for text: "${waitForText}"`);
        }
      }, interval);
    });

  } else {
    await new Promise(ok => setTimeout(ok, waitTime));
  }

  return {
    url: document.location.href,
    body: document.documentElement.outerHTML,
    resp: {
      headers: {'content-type': 'text/html'},
    },
  };
}

const getDocumentFromTab = async (tabId, status, waitForMsec, waitForText) => {
  const result = await chrome.scripting.executeScript({
    target: { tabId },
    injectImmediately: true,
    func: injectFunction,
    args: [waitForMsec, waitForText || false],
  });

  if (!result || !result.length || result.length == 0 || !result[0].result) {
    return;
  }

  const data = result[0].result;
  data.resp.status = status;

  const doc = new Document();
  doc.loadData(data);
  doc.parse();
  return doc;
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
        // Check for hash match
        for (let tab of (tabs || [])) {
          if (tab.url == url) ok(tab);
        }
        ok(null);
      });
  });
}
