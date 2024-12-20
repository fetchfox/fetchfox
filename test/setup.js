let shouldIgnore = true;

export const setShouldIgnore = (val) => {
  shouldIgnore = val;
};

process.on('unhandledRejection', async (reason, p) => {
  if (shouldIgnore) return;
  console.log('Unhandled Rejection at:', p, 'reason:', reason);
  process.exit(1);
});
