import express from "express";
import { createLogger } from './logger.js';
import {
  jsonPath,
  fileExists,
  readJsonFile,
  writeJsonFile,
  deleteFile,
  pathIdentifier,
  shortify,
} from './utils.js';

const router = express.Router();

/**
 * GET JSON file
 */
router.get("/*path", (req, res) => {
  const log = createLogger(req.appName, "GET", req.path);
  try {
    const parts = req.params.path;
    const file = jsonPath(parts);
    const pathId = pathIdentifier(file);

    if (!fileExists(file)) {
      log.info("File not found. Returning 404");
      return res.status(404).json({ error: "Not found" });
    }

    const data = readJsonFile(file);
    log.info("Get ->", { path: pathId });
    res.json(data);
  } catch (error) {
    log.error("Error reading file:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST (Save) JSON file
 */
router.post("/*path", (req, res) => {
  const log = createLogger(req.appName, "POST", req.path, req.appName);

  try {
    const parts = req.params.path;
    const file = jsonPath(parts);
    const pathId = pathIdentifier(file);

    writeJsonFile(file, req.body);

    log.info("Save ->", { path: pathId, data: shortify(req.body) });

    req.app.locals.wsManager.broadcastChange(pathId, req.body, req.appName);
    res.json({ status: "saved", path: pathId });
  } catch (error) {
    log.error("Error saving file:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * DELETE JSON file
 */
router.delete("/*path", (req, res) => {
  const log = createLogger(req.appName, "DEL", req.path);

  try {
    const parts = req.params.path;
    const file = jsonPath(parts);
    const pathId = pathIdentifier(file);

    if (fileExists(file)) {
      log.info("Deleting file");
      deleteFile(file);

      req.app.locals.wsManager.broadcastChange(pathId, null, req.appName);

      log.info("Deleted ->", { path: pathId });
      res.json({ status: "deleted", path: pathId });
    } else {
      log.info("File not found. Returning 404");
      res.status(404).json({ error: "Not found" });
    }
  } catch (error) {
    log.error("Error deleting file:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Catch-all 404 handler for any routes not matched above
 * This must be the last route defined
 */
router.use("/*path", (req, res) => {
  const log = createLogger(req.appName, "404", req.originalUrl);
  log.info(`Route not found: ${req.method} ${req.originalUrl}`);

  res.status(404).json({
    error: "Route not found",
    method: req.method,
    path: req.originalUrl,
    message: "The requested endpoint does not exist"
  });
});

export default router;
