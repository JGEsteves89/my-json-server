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

const router = express.Router();

const validatePath = (req, res) => {
  const parts = req.params.path;
  const file = jsonPath(parts, req.appName);
  if (!file) {
    res.status(400).json({
      error: '`VALIDATION_ERROR',
      message: 'Path name is not valid',
      statusCode: 400,
    });
    return null;
  }
  return { file, pathId: pathIdentifier(file, req.appName) };
};

/**
 * @route GET /*path
 * @description Retrieves the JSON content of a specified file path. Returns the file data if found.
 *              Responds with 404 if the file does not exist.
 */
router.get('/*path', (req, res) => {
  const log = createLogger(req.appName, 'GET', req.path);
  try {
    const validated = validatePath(req, res);
    if (!validated) return;
    const { file, pathId } = validated;

    if (!fileExists(file)) {
      log.info('Server: File not found. Returning 404');
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Path of the file could not be found',
        statusCode: 404,
      });
    }

    const data = readJsonFile(file);
    log.info('Get ->', { path: pathId });
    res.json(data);
  } catch (error) {
    log.error('Error reading file:', error.message);
    res.status(500).json({
      error: 'ERROR_CODE',
      message: 'Error while getting the data, please check server logs for more details',
      statusCode: 500,
    });
  }
});

/**
 * @route POST /*path
 * @description Creates or updates a JSON file at the specified path.
 *              Valid JSON body is required. Broadcasts changes via WebSocket.
 */
router.post('/*path', (req, res) => {
  const log = createLogger(req.appName, 'POST', req.path, req.appName);
  try {
    const validated = validatePath(req, res);
    if (!validated) return;
    const { file, pathId } = validated;

    if (!validJsonData(req.body)) {
      log.error('Error: Body is not valid', req.body);
      return res.status(400).json({
        error: '`INVALID_JSON',
        message: 'Error while saving data, please check server logs for more details',
        statusCode: 400,
      });
    }

    const existed = fileExists(file);
    writeJsonFile(file, req.body);

    if (existed) {
      log.info('Saved->', { path: pathId, data: shortify(req.body) });
      res.json({ status: 'saved', path: pathId });
    } else {
      log.info('Created->', { path: pathId, data: shortify(req.body) });
      res.json({ status: 'created', path: pathId });
    }

    req.app.locals.wsManager.broadcastChange(pathId, req.body, req.appName);
  } catch (error) {
    log.error('Error saving file:', error.message);
    res.status(500).json({
      error: 'ERROR_CODE',
      message: 'Error while saving data, please check server logs for more details',
      statusCode: 500,
    });
  }
});

/**
 * @route DELETE /*path
 * @description Deletes the JSON file at the specified path if it exists.
 *              Broadcasts deletion via WebSocket.
 */
router.delete('/*path', (req, res) => {
  const log = createLogger(req.appName, 'DEL', req.path);
  try {
    const validated = validatePath(req, res);
    if (!validated) return;
    const { file, pathId } = validated;

    if (fileExists(file)) {
      log.info('Deleting file');
      deleteFile(file);
      req.app.locals.wsManager.broadcastChange(pathId, null, req.appName);
      log.info('Deleted ->', { path: pathId });
      res.json({ status: 'deleted', path: pathId });
    } else {
      log.info('File not found. Returning 404');
      res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Path of the file could not be found',
        statusCode: 404,
      });
    }
  } catch (error) {
    log.error('Error deleting file:', error.message);
    res.status(500).json({
      error: 'ERROR_CODE',
      message: 'Error while deleting data, please check server logs for more details',
      statusCode: 500,
    });
  }
});

/**
 * @route USE /*path
 * @description Catch-all route handler for undefined endpoints. Returns a 404 error.
 */
router.use('/*path', (req, res) => {
  const log = createLogger(req.appName, '404', req.originalUrl);
  log.info(`Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: 'Server: route not found',
    method: req.method,
    path: req.originalUrl,
    message: 'The requested endpoint does not exist',
  });
});

export default router;
