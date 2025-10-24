export const CONFIG = {
  PORT: process.env.PORT ? Number(process.env.PORT) : 3000,
  DATA_DIR: process.env.DATA_DIR || './data',
  API_TOKENS: process.env.API_TOKENS
    ? JSON.parse(process.env.API_TOKENS)
    : { TEST_APP: 'THIS_IS_A_TEST_TOKEN' },
  RATE_LIMIT: {
    windowMs: process.env.RATE_LIMIT_WINDOW_MS ? Number(process.env.RATE_LIMIT_WINDOW_MS) : 60_000, // 1 minute
    max: process.env.RATE_LIMIT_MAX ? Number(process.env.RATE_LIMIT_MAX) : 100,
  },
};
