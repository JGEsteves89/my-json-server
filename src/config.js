export const CONFIG = {
  PORT: process.env.PORT ? Number(process.env.PORT) : 3000,
  DATA_DIR: process.env.DATA_DIR || './data',
  API_TOKENS_PATH: process.env.API_TOKENS_PATH || './defaultApiKeys.json',
  RATE_LIMIT: {
    windowMs: process.env.RATE_LIMIT_WINDOW_MS ? Number(process.env.RATE_LIMIT_WINDOW_MS) : 60_000, // 1 minute
    max: process.env.RATE_LIMIT_MAX ? Number(process.env.RATE_LIMIT_MAX) : 100,
  },
};
