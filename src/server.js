import express from 'express';
import bodyParser from 'body-parser';
import rateLimit from 'express-rate-limit';
import cors from 'cors';

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { CONFIG } from './config.js';
import { ensureDataDir } from './utils.js';
import { apiTokenMiddleware } from './apiTokenMiddleware.js';
import { errorHandler } from './errorHandler.js';
import WebSocketManager from './websocket.js';
import routes from './routes.js';
import { createLogger } from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pkgPath = path.resolve(__dirname, '../package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

const banner = `
▄▄▄▄  ▄   ▄     ▗▖ ▄▄▄  ▄▄▄  ▄▄▄▄    ▄▄▄▗▞▀▚▖ ▄▄▄ ▄   ▄ ▗▞▀▚▖ ▄▄▄ 
█ █ █ █   █     ▗▖▀▄▄  █   █ █   █  ▀▄▄ ▐▛▀▀▘█    █   █ ▐▛▀▀▘█    
█   █  ▀▀▀█  ▄  ▐▌▄▄▄▀ ▀▄▄▄▀ █   █  ▄▄▄▀▝▚▄▄▖█     ▀▄▀  ▝▚▄▄▖█    
          █  ▀▄▄▞▘                                                 
`;

console.log(banner); // eslint-disable-line no-console
console.log(`*** my-json-server-v${pkg.fullVersion} ***`); // eslint-disable-line no-console
console.log('-------------------------------------------'); // eslint-disable-line no-console

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

    // setup CORS
    this.app.use(
      cors({
        origin: CONFIG.ALLOWRD_ORIGIN,
        methods: ['GET', 'POST', 'DELETE'],
      }),
    );

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
      const log = createLogger('SYSTEM', 'SERVER', 'startup');
      // Ensure data directory exists
      ensureDataDir();

      this.server = this.app.listen(CONFIG.PORT, () => {
        log.info(`Server started on http://localhost:${CONFIG.PORT}`);
        resolve();
      });

      this.server.on('upgrade', (req, socket, head) =>
        this.wsManager.handleUpgrade(req, socket, head),
      );

      this.server.on('error', (err) => {
        log.info('Server listen error:', err);
        this.server.close(resolve);
      });
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
