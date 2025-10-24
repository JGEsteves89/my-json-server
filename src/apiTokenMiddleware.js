import { createLogger } from './logger.js';
import { validateApiToken } from './auth.js';
import { ForbiddenError } from './errors.js';

export function apiTokenMiddleware(req, res, next) {
  const log = createLogger('SYSTEM', 'API', req.path);
  const token = req.headers['x-api-token'];
  const appName = validateApiToken(token);

  if (!appName) {
    const message = token ? 'Invalid API token provided' : 'API token is required';
    log.info(`Token validation failed: ${message}`);
    return next(new ForbiddenError(message));
  }

  req.appName = appName;
  next();
}
