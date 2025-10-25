import fs from 'node:fs';
import path from 'node:path';
import request from 'supertest';
import WebSocket from 'ws';

import server from '../src/server.js';
import { jsonPath, pathIdentifier } from '../src/utils.js';
import { CONFIG } from '../src/config.js';

const app = server.app;
const pathId = '/a';
const wsUrl = `ws://localhost:${CONFIG.PORT}${pathId}`;
const token = JSON.parse(fs.readFileSync(CONFIG.API_TOKENS_PATH).toString())['TEST_APP'];
const dummy = { dummy: 'data' };

beforeAll(async () => {
  await server.start();
});

afterAll(async () => {
  await server.stop();
});

describe('Path Utilities', () => {
  const appName = 'TEST_APP';

  test('jsonPath builds valid absolute path', () => {
    const parts = ['this', 'is', 'a', 'test'];
    const result = jsonPath(parts, appName);

    expect(result.endsWith('/data/TEST_APP/this/is/a/test.json')).toBe(true);
    expect(path.isAbsolute(result)).toBe(true);
  });

  test('pathIdentifier reverses jsonPath correctly', () => {
    const parts = ['this', 'is', 'a', 'test'];
    const file = jsonPath(parts, appName);
    const pathId = pathIdentifier(file, appName);

    expect(pathId).toBe('/this/is/a/test');
  });

  test('round-trip pathId → file → pathId stays identical', () => {
    const parts = ['this', 'is', 'a', 'test'];
    const file = jsonPath(parts, appName);
    const pathId = pathIdentifier(file, appName);

    const reconstructed = pathIdentifier(jsonPath(parts, appName), appName);
    expect(reconstructed).toBe(pathId);
  });

  test('throws error for invalid characters', () => {
    expect(() => jsonPath(['..', 'evil'], appName)).toThrow('Invalid path component');
  });

  test('prevents escaping base directory', () => {
    const evilParts = ['..', '..', 'etc', 'passwd'];
    expect(() => jsonPath(evilParts, appName)).toThrow('Invalid path');
  });
});

describe('API Access Control and WebSocket Behavior', () => {
  it('rejects GET without token', async () => {
    const res = await request(app).get(pathId);
    expect(res.statusCode).toBe(403);
    expect(res.body.error).toBe('FORBIDDEN');
    expect(res.body.message).toBe('API token is required');
  });

  it('rejects POST without token', async () => {
    const res = await request(app).post(pathId).send(dummy);
    expect(res.statusCode).toBe(403);
    expect(res.body.error).toBe('FORBIDDEN');
    expect(res.body.message).toBe('API token is required');
  });

  it('rejects DELETE without token', async () => {
    const res = await request(app).delete(pathId);
    expect(res.statusCode).toBe(403);
    expect(res.body.error).toBe('FORBIDDEN');
    expect(res.body.message).toBe('API token is required');
  });

  it('creates JSON when authenticated', async () => {
    const res = await request(app).post(pathId).set('x-api-token', token).send(dummy);
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('created');
    expect(res.body.path).toBe(pathId);
  });

  it('saves JSON when authenticated', async () => {
    const res = await request(app).post(pathId).set('x-api-token', token).send(dummy);
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('updated');
    expect(res.body.path).toBe(pathId);
  });

  it('gets JSON when authenticated', async () => {
    const res = await request(app).get(pathId).set('x-api-token', token);
    expect(res.statusCode).toBe(200);
    expect(res.body.dummy).toBe(dummy.dummy);
  });

  it('deletes file when authenticated', async () => {
    const res = await request(app).delete(pathId).set('x-api-token', token);
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('deleted');
    expect(res.body.path).toBe(pathId);
  });

  it('returns not found for GET on non-existent resource', async () => {
    const res = await request(app).get(pathId).set('x-api-token', token);
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('NOT_FOUND');
    expect(res.body.message).toBe('The requested file could not be found');
  });

  // eslint-disable-next-line sonarjs/assertions-in-tests
  it('blocks WebSocket connection without token', (done) => {
    const ws = new WebSocket(wsUrl);
    ws.on('open', () => done(new Error('Connection should be denied')));
    ws.on('error', () => done());
  });

  // eslint-disable-next-line sonarjs/assertions-in-tests
  it('allows WebSocket connection with valid token', (done) => {
    const ws = new WebSocket(wsUrl, { headers: { 'x-api-token': token } });
    ws.on('open', () => done());
    ws.on('error', () => done(new Error('Connection should be successful')));
  });

  it('broadcasts WebSocket message on file change', (done) => {
    const ws = new WebSocket(wsUrl, { headers: { 'x-api-token': token } });

    ws.on('open', async () => {
      const res = await request(app).post(pathId).set('x-api-token', token).send(dummy);
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('created');
      expect(res.body.path).toBe(pathId);
    });

    ws.on('error', () => done(new Error('Unexpected WebSocket error')));
    ws.on('message', (msg) => {
      const data = JSON.parse(msg.toString());
      expect(data.path).toBe(pathId);
      done();
    });
  });

  it('broadcasts WebSocket message on file delete', (done) => {
    const ws = new WebSocket(wsUrl, { headers: { 'x-api-token': token } });

    ws.on('open', async () => {
      const res = await request(app).delete(pathId).set('x-api-token', token);
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('deleted');
      expect(res.body.path).toBe(pathId);
    });

    ws.on('error', () => done(new Error('Unexpected WebSocket error')));
    ws.on('message', (msg) => {
      const data = JSON.parse(msg.toString());
      expect(data.path).toBe(pathId);
      done();
    });
  });
});
