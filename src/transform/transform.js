export const transform = async (html, transformers) => {
  let out = { html };
  for (const t of transformers) {
    out = await t.transform(out.html);
  }
  return out;
}
