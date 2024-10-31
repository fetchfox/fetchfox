export const ChromeRelayActor = class {
  constructor(rec) {
    rec.listen(this.act);
  }

  act(data) {
    if (data.command == 'fetch') {
      this.fetch(data);
    } else {
      throw new Error(`Unhandled command ${JSON.stringify(data)}`);
    }
  }

  fetch(data) {
    const url = data.url;

    console.log('relay chrome use url:', url);

    const tab = new Promise(ok => chrome.tabs.create(
      { url: request.url, active: false },
      ok));

    console.log('relay chrome got tab:', tab);

    const result = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      injectImmediately: true,
      args: [],
      func: injectFunction,
    });

    console.log('relay chrome got result:', result);
  }
}

const injectFunction = async () => {
  return 'TODO HTML';
}
