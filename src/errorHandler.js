import { createLogger } from './logger.js';
import { AppError } from './errors.js';

export function errorHandler(err, req, res, next) {
  const log = createLogger(req.appName || 'SYSTEM', 'ERROR', req.path);

  // If response already sent, delegate to default Express error handler
  if (res.headersSent) {
    return next(err);
  }

  // Handle custom AppError instances
  if (err instanceof AppError) {
    log.info(`Application error: ${err.message}`, { error: err.error, statusCode: err.statusCode });
    return res.status(err.statusCode).json({
      error: err.error,
      message: err.message,
      statusCode: err.statusCode,
    });
  }

  // Handle unexpected errors
  log.error(`Unexpected error: ${err.message}`, { stack: err.stack });
  return res.status(500).json({
    error: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
    statusCode: 500,
  });
}
