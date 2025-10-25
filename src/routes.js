import express from 'express';
import { createLogger } from './logger.js';
import {
  jsonPath,
  fileExists,
  readJsonFile,
  writeJsonFile,
  deleteFile,
  pathIdentifier,
  shortify,
  validJsonData,
} from './utils.js';
import { ValidationError, NotFoundError, InternalServerError } from './errors.js';

const router = express.Router();

const validatePath = (req, res, next) => {
  try {
    const parts = req.params.path;
    const file = jsonPath(parts, req.appName);
    const pathId = pathIdentifier(file, req.appName);

    // ✅ Validation step: confirm round-trip integrity
    const revalidated = pathIdentifier(jsonPath(parts, req.appName), req.appName);
    if (revalidated !== pathId) {
      return next(new ValidationError(`Path validation mismatch: ${revalidated} != ${pathId}`));
    }

    return { file, pathId };
  } catch (error) {
    const log = createLogger(req.appName, 'VAL', req.path);
    log.info('Validation error', error);
    return next(new ValidationError('Invalid path provided'));
  }
};

/**
 * @route GET /*path
 * @description Retrieves the JSON content of a specified file path. Returns the file data if found.
 *              Responds with 404 if the file does not exist.
 */
router.get('/*path', (req, res, next) => {
  const log = createLogger(req.appName, 'GET', req.path);
  const validated = validatePath(req, res, next);
  if (!validated) return;
  const { file, pathId } = validated;

  if (!fileExists(file)) {
    log.info('File not found', { path: pathId });
    return next(new NotFoundError('The requested file could not be found'));
  }

  try {
    const data = readJsonFile(file);
    log.info('Retrieved file', { path: pathId });
    res.json(data);
  } catch (err) {
    log.error('Error reading file', { path: pathId, error: err.message });
    next(new InternalServerError('Error reading file'));
  }
});

/**
 * @route POST /*path
 * @description Creates or updates a JSON file at the specified path.
 *              Valid JSON body is required. Broadcasts changes via WebSocket.
 */
router.post('/*path', (req, res, next) => {
  const log = createLogger(req.appName, 'POST', req.path);
  const validated = validatePath(req, res, next);
  if (!validated) return;
  const { file, pathId } = validated;

  if (!validJsonData(req.body)) {
    log.info('Invalid JSON data provided', { path: pathId });
    return next(new ValidationError('Request body must be valid JSON'));
  }

  try {
    const existed = fileExists(file);
    writeJsonFile(file, req.body);

    const action = existed ? 'updated' : 'created';
    log.info(`File ${action}`, { path: pathId, data: shortify(req.body) });
    res.json({ status: action, path: pathId });

    req.app.locals.wsManager.broadcastChange(pathId, req.body, req.appName);
  } catch (err) {
    log.error('Error saving file', { path: pathId, error: err.message });
    next(new InternalServerError('Error saving file'));
  }
});

/**
 * @route DELETE /*path
 * @description Deletes the JSON file at the specified path if it exists.
 *              Broadcasts deletion via WebSocket.
 */
router.delete('/*path', (req, res, next) => {
  const log = createLogger(req.appName, 'DELETE', req.path);
  const validated = validatePath(req, res, next);
  if (!validated) return;
  const { file, pathId } = validated;

  if (fileExists(file)) {
    try {
      log.info('Deleting file', { path: pathId });
      deleteFile(file);
      req.app.locals.wsManager.broadcastChange(pathId, null, req.appName);
      log.info('File deleted', { path: pathId });
      res.json({ status: 'deleted', path: pathId });
    } catch (err) {
      log.error('Error deleting file', { path: pathId, error: err.message });
      next(new InternalServerError('Error deleting file'));
    }
  } else {
    log.info('File not found', { path: pathId });
    return next(new NotFoundError('The requested file could not be found'));
  }
});

/**
 * @route USE /*path
 * @description Catch-all route handler for undefined endpoints. Returns a 404 error.
 */
router.use('/*path', (req, res, next) => {
  const log = createLogger(req.appName, 'ROUTE', req.originalUrl);
  log.info('Route not found', { method: req.method, path: req.originalUrl });
  next(new NotFoundError('The requested endpoint does not exist'));
});

export default router;
