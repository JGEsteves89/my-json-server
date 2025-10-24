import { createLogger } from './logger.js';
import { validateApiToken } from './auth.js';

export function apiTokenMiddleware(req, res, next) {
  const log = createLogger('SYS', 'API', req.path);
  const token = req.headers['x-api-token'];
  const appName = validateApiToken(token);

  if (!appName) {
    log.info(token ? 'Forbidden: Invalid API Token' : 'Forbidden: Missing API Token');
    return res.status(401).json({
      error: 'INVALID_TOKEN/`MISSING_TOKEN',
      message: 'Forbidden: Missing API Token',
      statusCode: 401,
    });
  }

  req.appName = appName;
  next();
}
