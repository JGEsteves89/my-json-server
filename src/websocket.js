import { WebSocketServer } from 'ws';
import { pathIdentifier, jsonPath, prettyPrint, shortify } from './utils.js';
import { createLogger } from './logger.js';
import { validateApiToken } from './auth.js';

class WebSocketManager {
  constructor() {
    this.wss = new WebSocketServer({ noServer: true });
    this.watchers = new Map(); // key: jsonPath, value: Set of sockets
  }

  /**
   * Broadcast changes to all watching clients
   * @param {string} jsonFile - Path to the changed file
   * @param {Object|null} data - New data or null for deletion
   */
  broadcastChange(jsonFile, data, appName) {
    const log = createLogger(appName, 'WS');

    const clients = this.watchers.get(jsonFile);
    if (clients) {
      const message = JSON.stringify({ path: jsonFile, data });
      for (const ws of clients) {
        if (ws.readyState === ws.OPEN) {
          ws.send(message);
        }
      }
      log.info(
        'Broadcast change',
        prettyPrint({ clientsListening: clients.length, path: jsonFile, data: shortify(data) }),
      );
    } else {
      log.info('No clients watching this file', { jsonFile });
    }
  }

  /**
   * Handle WebSocket upgrade
   * @param {Object} req - Request object
   * @param {Object} socket - Socket object
   * @param {Buffer} head - Head buffer
   */
  handleUpgrade(req, socket, head) {
    const token = req.headers['x-api-token'];
    const appName = validateApiToken(token);
    const log = createLogger(appName, 'WS', req.url);

    if (!appName) {
      log.info('Forbidden WebSocket connection');
      socket.write(
        'HTTP/1.1 401 INVALID_TOKEN \r\n' +
          'Content-Type: application/json\r\n' +
          'Connection: close\r\n' +
          '\r\n' +
          JSON.stringify({
            error: 'INVALID_TOKEN/`MISSING_TOKEN',
            message: 'Forbidden: Missing API Token',
            statusCode: 401,
          }),
      );
      socket.destroy();
      return;
    }

    this.wss.handleUpgrade(req, socket, head, (ws) => {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const parts = url.pathname.split('/').filter(Boolean);
      const file = jsonPath(parts, appName);

      if (!file) {
        socket.write(
          'HTTP/1.1 400 VALIDATION_ERROR \r\n' +
            'Content-Type: application/json\r\n' +
            'Connection: close\r\n' +
            '\r\n' +
            JSON.stringify({
              error: '`VALIDATION_ERROR',
              message: 'Path name is not valid',
              statusCode: 400,
            }),
        );
        socket.destroy();
        return;
      }

      const watchPath = pathIdentifier(file, appName);

      if (!this.watchers.has(watchPath)) {
        this.watchers.set(watchPath, new Set());
      }
      this.watchers.get(watchPath).add(ws);
      log.info('Client added to watchers', {
        path: watchPath,
        totalWatchers: this.watchers.get(watchPath).size,
      });

      ws.on('close', () => {
        const clients = this.watchers.get(watchPath);
        if (clients) {
          clients.delete(ws);
          log.info('Client removed from watchers', { remainingWatchers: clients.size });
          if (clients.size === 0) {
            this.watchers.delete(watchPath);
          }
        }
      });
    });
  }

  closeAll() {
    for (const clients of this.watchers.values()) {
      for (const ws of clients) {
        if (ws.readyState === ws.OPEN || ws.readyState === ws.CONNECTING) {
          ws.terminate();
        }
      }
    }
    this.watchers.clear();
    this.wss.close();
  }
}

export default WebSocketManager;
