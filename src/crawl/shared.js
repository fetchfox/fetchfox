export const norm = (url) => {
  try {
    return new URL(url).toString().replace(/#.*$/, '');
  } catch {
    // console.log('norm catch:', url);
    return url;
  }
}
