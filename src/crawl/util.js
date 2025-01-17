import { chunkList } from "../util.js";

export const validate = (url) => {
  return url && url.indexOf("javascript:") != 0;
};

export const normalize = (url) => {
  const obj = new URL(url);
  obj.hash = "";
  return obj.toString();
};

export const linkChunks = (doc, maxBytes) => {
  const slimmer = (item) => ({
    id: item.id,
    html: item.html.substr(0, 400),
    text: item.text,
    url: item.url,
  });

  return chunkList(
    doc.links.map(slimmer).filter((l) => validate(l.url)),
    maxBytes,
  );
};

export const decodeLinks = (links, ids) => {
  const l = [];
  for (const id of ids) {
    for (const link of links) {
      if ("" + link.id == "" + id) {
        l.push(link);
      }
    }
  }
  return l;
};
