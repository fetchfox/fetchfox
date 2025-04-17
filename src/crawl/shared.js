export const norm = (url) => {
  try {
    return new URL(url).toString().replace(/#.*$/, '');
  } catch {
    return url;
  }
}

export const domain = (url) => {
  let u;
  try {
    u = new URL(url);
  } catch {
    return;
  }
  return u.host.split('.').slice(-2).join('.');
}
