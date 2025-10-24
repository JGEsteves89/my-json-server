import { createLogger } from './logger.js';
import { validateApiToken } from './auth.js';

export function apiTokenMiddleware(req, res, next) {
	const log = createLogger("", "API", req.path);
	const token = req.headers['x-api-token'];
	const appName = validateApiToken(token);

	if (!appName) {
		log.info(token ? 'Forbidden: Invalid API Token' : 'Forbidden: Missing API Token');
		return res.status(403).json({ error: 'Forbidden: Invalid API Token' });
	}

	req.appName = appName;
	next();
}