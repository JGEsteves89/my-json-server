import express from 'express';
import bodyParser from 'body-parser';
import rateLimit from 'express-rate-limit';

import { CONFIG } from './config.js';
import { ensureDataDir } from './utils.js';
import { apiTokenMiddleware } from './apiTokenMiddleware.js';
import { errorHandler } from './errorHandler.js';
import WebSocketManager from './websocket.js';
import routes from './routes.js';
import { createLogger } from './logger.js';

class Server {
  constructor() {
    this.app = express();
    this.wsManager = new WebSocketManager();
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    // Body parser
    this.app.use(bodyParser.json());

    // Rate limiting
    const limiter = rateLimit(CONFIG.RATE_LIMIT);
    this.app.use(limiter);

    // Set up token validation middleware
    this.app.use(apiTokenMiddleware);

    // Make WebSocket manager available to routes
    this.app.locals.wsManager = this.wsManager;
  }

  setupRoutes() {
    this.app.use(routes);
    // Global error handler must be registered after all routes
    this.app.use(errorHandler);
  }

  async start() {
    return new Promise((resolve) => {
      // Ensure data directory exists
      ensureDataDir();

      this.server = this.app.listen(CONFIG.PORT, () => {
        const log = createLogger('SYSTEM', 'SERVER', 'startup');
        log.info(`Server started on http://localhost:${CONFIG.PORT}`);
        resolve();
      });
      this.server.on('upgrade', (req, socket, head) =>
        this.wsManager.handleUpgrade(req, socket, head),
      );
    });
  }

  async stop() {
    return new Promise((resolve) => {
      this.wsManager.closeAll(); // implement closeAll() to close WS
      this.server.close(resolve);
    });
  }
}

const server = new Server();

export default server; // export the express app for Supertest

// Only auto-start if not in test environment
if (process.env.NODE_ENV !== 'test') {
  (async () => {
    await server.start();
  })();
}
