export const validate = (url) => {
  return url && url.indexOf('javascript:') != 0;
};

export const normalize = (url) => {
  const obj = new URL(url);
  obj.hash = '';
  return obj.toString();
};

