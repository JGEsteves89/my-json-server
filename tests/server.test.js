import request from 'supertest';
import server from '../src/server.js';
import { CONFIG } from '../src/config.js';
import WebSocket from 'ws';

const app = server.app;
const pathId = '/a';
const wsUrl = `ws://localhost:${CONFIG.PORT}${pathId}`;
const token = CONFIG.API_TOKENS['TEST_APP'];
const dummy = { dummy: 'data' };

beforeAll(async () => {
  await server.start();
});

afterAll(async () => {
  await server.stop();
});

describe('API Access Control and WebSocket Behavior', () => {
  it('rejects GET without token', async () => {
    const res = await request(app).get(pathId);
    expect(res.statusCode).toBe(403);
    expect(res.body.error).toMatch(/Forbidden/);
  });

  it('rejects POST without token', async () => {
    const res = await request(app).post(pathId).send(dummy);
    expect(res.statusCode).toBe(403);
    expect(res.body.error).toMatch(/Forbidden/);
  });

  it('rejects DELETE without token', async () => {
    const res = await request(app).delete(pathId);
    expect(res.statusCode).toBe(403);
    expect(res.body.error).toMatch(/Forbidden/);
  });

  it('creates JSON when authenticated', async () => {
    const res = await request(app).post(pathId).set('x-api-token', token).send(dummy);
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('saved');
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
  });

  it('blocks WebSocket connection without token', (done) => {
    const ws = new WebSocket(wsUrl);
    ws.on('open', () => done(new Error('Connection should be denied')));
    ws.on('error', () => done());
  });

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
      expect(res.body.status).toBe('saved');
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
