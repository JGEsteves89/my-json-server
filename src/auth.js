import { CONFIG } from './config.js';
import { createLogger } from './logger.js';
import { fileExists, readJsonFile } from './utils.js';

function readApiTokensFile() {
  // initialize logger
  const log = createLogger('SYSTEM', 'API', 'validation');

  if (!fileExists(CONFIG.API_TOKENS_PATH)) {
    // ensure API tokens file exists
    log.info('Invalid API Tokens json path', { apiTokensPath: CONFIG.API_TOKENS_PATH });
    return null;
  }

  try {
    // load tokens from file
    const api_tokens = readJsonFile(CONFIG.API_TOKENS_PATH);

    return api_tokens;
  } catch (error) {
    // return null if JSON parsing fails
    log.info('Invalid API Tokens json. Cannot parse', {
      apiTokensPath: CONFIG.API_TOKENS_PATH,
      error,
    });
    return null;
  }
}

export function validateApiToken(token) {
  if (!token) return null; // early return if token is missing

  // load tokens from file to ensure that is always up to date
  // IMPROVE: make this more resource friendly
  const api_tokens = readApiTokensFile();

  // an error occured reading the file
  if (!api_tokens) return null;

  // match token to user/key
  return Object.entries(api_tokens).find(([, t]) => t === token)?.[0] || null;
}
