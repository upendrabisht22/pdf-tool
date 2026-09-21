/**
 * @file apps/web/test/p2p-signaling.test.js
 * @description Unit & integration test suite for in-memory ephemeral WebRTC signaling relay (/api/v1/p2p/*).
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import {
  handleP2pSignalingRoutes,
  generateRoomCode,
  generatePeerId,
  getActiveRoomCount,
  clearAllP2pRoomsForTesting
} from '../api/p2p-signaling.js';

function createMockReq({ method = 'GET', url = '/', headers = {}, body = null }) {
  const req = new EventEmitter();
  req.method = method;
  req.url = url;
  req.headers = { host: 'localhost', ...headers };
  req.socket = { remoteAddress: '127.0.0.1' };

  process.nextTick(() => {
    if (body !== null) {
      const data = typeof body === 'string' ? body : JSON.stringify(body);
      req.emit('data', Buffer.from(data));
    }
    req.emit('end');
  });

  return req;
}

function createMockRes() {
  const res = new EventEmitter();
  res.headers = {};
  res.statusCode = 200;
  res.body = '';
  res.writtenEvents = [];
  res.writableEnded = false;

  res.writeHead = (statusCode, headers = {}) => {
    res.statusCode = statusCode;
    res.headers = { ...res.headers, ...headers };
  };

  res.write = (chunk) => {
    const text = chunk.toString();
    res.body += text;
    res.writtenEvents.push(text);
    return true;
  };

  res.end = (chunk) => {
    if (chunk) res.write(chunk);
    res.writableEnded = true;
    res.emit('finish');
  };

  return res;
}

function makeSendJson(res) {
  return (statusCode, data) => {
    res.statusCode = statusCode;
    res.headers['content-type'] = 'application/json';
    res.body = JSON.stringify(data);
    res.jsonData = data;
    res.writableEnded = true;
  };
}

describe('WebRTC P2P Signaling Relay (/api/v1/p2p/*)', () => {
  beforeEach(() => {
    clearAllP2pRoomsForTesting();
  });

  it('generateRoomCode produces clean human-friendly 6-7 char code (e.g. LAB-402)', () => {
    const code = generateRoomCode();
    assert.match(code, /^[A-Z0-9]{3,4}-[0-9A-Z]{3,4}$/, `Invalid room code format: ${code}`);
  });

  it('POST /api/v1/p2p/rooms creates ephemeral room with host role', async () => {
    const req = createMockReq({ method: 'POST', url: '/api/v1/p2p/rooms' });
    const res = createMockRes();
    const sendJson = makeSendJson(res);

    const handled = await handleP2pSignalingRoutes(req, res, '/api/v1/p2p/rooms', sendJson);
    assert.equal(handled, true);
    assert.equal(res.statusCode, 201);
    assert.equal(res.jsonData.ok, true);
    assert.ok(res.jsonData.roomId, 'Room ID must be returned');
    assert.ok(res.jsonData.peerId, 'Peer ID must be returned');
    assert.equal(res.jsonData.role, 'host');
    assert.equal(getActiveRoomCount(), 1);
  });

  it('POST /api/v1/p2p/rooms/:id/join allows 2nd peer and rejects 3rd peer', async () => {
    // 1. Create room
    const createReq = createMockReq({ method: 'POST', url: '/api/v1/p2p/rooms' });
    const createRes = createMockRes();
    await handleP2pSignalingRoutes(createReq, createRes, '/api/v1/p2p/rooms', makeSendJson(createRes));
    const { roomId, peerId: hostPeerId } = createRes.jsonData;

    // 2. Join 2nd peer
    const joinReq = createMockReq({ method: 'POST', url: `/api/v1/p2p/rooms/${roomId}/join` });
    const joinRes = createMockRes();
    const joinHandled = await handleP2pSignalingRoutes(joinReq, joinRes, `/api/v1/p2p/rooms/${roomId}/join`, makeSendJson(joinRes));

    assert.equal(joinHandled, true);
    assert.equal(joinRes.statusCode, 200);
    assert.equal(joinRes.jsonData.ok, true);
    assert.equal(joinRes.jsonData.role, 'joiner');
    assert.notEqual(joinRes.jsonData.peerId, hostPeerId);

    // 3. Attempt to join 3rd peer (Must be rejected with 409 ROOM_FULL)
    const thirdReq = createMockReq({ method: 'POST', url: `/api/v1/p2p/rooms/${roomId}/join` });
    const thirdRes = createMockRes();
    await handleP2pSignalingRoutes(thirdReq, thirdRes, `/api/v1/p2p/rooms/${roomId}/join`, makeSendJson(thirdRes));

    assert.equal(thirdRes.statusCode, 409);
    assert.equal(thirdRes.jsonData.error?.code, 'ROOM_FULL');
  });

  it('POST /api/v1/p2p/rooms/:id/join returns 404 for nonexistent room', async () => {
    const req = createMockReq({ method: 'POST', url: '/api/v1/p2p/rooms/FAKE-999/join' });
    const res = createMockRes();
    await handleP2pSignalingRoutes(req, res, '/api/v1/p2p/rooms/FAKE-999/join', makeSendJson(res));

    assert.equal(res.statusCode, 404);
    assert.equal(res.jsonData.error?.code, 'ROOM_NOT_FOUND');
  });

  it('Rate-limits failed join attempts after 5 consecutive failures per IP', async () => {
    const mockIp = '192.168.1.100';

    for (let i = 0; i < 5; i++) {
      const req = createMockReq({
        method: 'POST',
        url: `/api/v1/p2p/rooms/WRONG-${i}/join`,
        headers: { 'x-forwarded-for': mockIp }
      });
      const res = createMockRes();
      await handleP2pSignalingRoutes(req, res, `/api/v1/p2p/rooms/WRONG-${i}/join`, makeSendJson(res));
      assert.equal(res.statusCode, 404);
    }

    // 6th attempt should be rate limited
    const blockedReq = createMockReq({
      method: 'POST',
      url: '/api/v1/p2p/rooms/WRONG-6/join',
      headers: { 'x-forwarded-for': mockIp }
    });
    const blockedRes = createMockRes();
    await handleP2pSignalingRoutes(blockedReq, blockedRes, '/api/v1/p2p/rooms/WRONG-6/join', makeSendJson(blockedRes));

    assert.equal(blockedRes.statusCode, 429);
    assert.equal(blockedRes.jsonData.error?.code, 'RATE_LIMITED');
  });

  it('GET /api/v1/p2p/rooms/:id/events connects SSE and emits room-ready', async () => {
    // 1. Create room
    const createReq = createMockReq({ method: 'POST', url: '/api/v1/p2p/rooms' });
    const createRes = createMockRes();
    await handleP2pSignalingRoutes(createReq, createRes, '/api/v1/p2p/rooms', makeSendJson(createRes));
    const { roomId, peerId } = createRes.jsonData;

    // 2. Connect SSE
    const sseReq = createMockReq({ method: 'GET', url: `/api/v1/p2p/rooms/${roomId}/events?peerId=${peerId}` });
    const sseRes = createMockRes();

    const handled = await handleP2pSignalingRoutes(sseReq, sseRes, `/api/v1/p2p/rooms/${roomId}/events`, makeSendJson(sseRes));
    assert.equal(handled, true);
    assert.equal(sseRes.statusCode, 200);
    assert.equal(sseRes.headers['Content-Type'], 'text/event-stream; charset=utf-8');

    // Verify initial event
    assert.ok(sseRes.writtenEvents.some(ev => ev.includes('event: room-ready')), 'Should emit room-ready SSE event');
  });

  it('POST /api/v1/p2p/rooms/:id/signal relays SDP/ICE signals between peers', async () => {
    // 1. Create room
    const createReq = createMockReq({ method: 'POST', url: '/api/v1/p2p/rooms' });
    const createRes = createMockRes();
    await handleP2pSignalingRoutes(createReq, createRes, '/api/v1/p2p/rooms', makeSendJson(createRes));
    const { roomId, peerId: hostId } = createRes.jsonData;

    // 2. Join 2nd peer
    const joinReq = createMockReq({ method: 'POST', url: `/api/v1/p2p/rooms/${roomId}/join` });
    const joinRes = createMockRes();
    await handleP2pSignalingRoutes(joinReq, joinRes, `/api/v1/p2p/rooms/${roomId}/join`, makeSendJson(joinRes));
    const { peerId: joinerId } = joinRes.jsonData;

    // 3. Connect Host to SSE
    const hostSseReq = createMockReq({ method: 'GET', url: `/api/v1/p2p/rooms/${roomId}/events?peerId=${hostId}` });
    const hostSseRes = createMockRes();
    await handleP2pSignalingRoutes(hostSseReq, hostSseRes, `/api/v1/p2p/rooms/${roomId}/events`, makeSendJson(hostSseRes));

    // 4. Joiner sends SDP answer to Host
    const signalReq = createMockReq({
      method: 'POST',
      url: `/api/v1/p2p/rooms/${roomId}/signal`,
      body: {
        senderId: joinerId,
        type: 'answer',
        payload: { sdp: 'v=0\r\no=...' }
      }
    });
    const signalRes = createMockRes();
    await handleP2pSignalingRoutes(signalReq, signalRes, `/api/v1/p2p/rooms/${roomId}/signal`, makeSendJson(signalRes));

    assert.equal(signalRes.statusCode, 200);
    assert.equal(signalRes.jsonData.ok, true);
    assert.equal(signalRes.jsonData.forwarded, true);

    // Verify Host received the signal event
    assert.ok(hostSseRes.writtenEvents.some(ev => ev.includes('event: signal') && ev.includes('answer')));
  });

  it('POST /api/v1/p2p/rooms/:id/leave gracefully cleans up empty rooms', async () => {
    const createReq = createMockReq({ method: 'POST', url: '/api/v1/p2p/rooms' });
    const createRes = createMockRes();
    await handleP2pSignalingRoutes(createReq, createRes, '/api/v1/p2p/rooms', makeSendJson(createRes));
    const { roomId, peerId } = createRes.jsonData;

    assert.equal(getActiveRoomCount(), 1);

    const leaveReq = createMockReq({
      method: 'POST',
      url: `/api/v1/p2p/rooms/${roomId}/leave`,
      body: { peerId }
    });
    const leaveRes = createMockRes();
    await handleP2pSignalingRoutes(leaveReq, leaveRes, `/api/v1/p2p/rooms/${roomId}/leave`, makeSendJson(leaveRes));

    assert.equal(leaveRes.statusCode, 200);
    assert.equal(getActiveRoomCount(), 0, 'Room must be purged when last peer leaves');
  });
});
