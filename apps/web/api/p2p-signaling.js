/**
 * @file p2p-signaling.js
 * @description In-memory, zero-disk ephemeral WebRTC signaling relay for DocPlatform P2P Share (/p2p-share).
 *
 * Conforms to P2P-SHARING-SPEC.md (Phase 2 & Phase 3):
 * - Ephemeral in-memory room hub (zero server disk writes, strictly RAM).
 * - Clean, readable 6-character room codes (e.g. LAB-402, DOC-891, P2P-714).
 * - Server-Sent Events (SSE) stream for instant SDP offer/answer & ICE candidate delivery.
 * - Rate-limited join attempts to prevent room brute-forcing.
 * - Auto-cleanup daemon purges idle/abandoned rooms after 10 minutes.
 */

import { randomBytes } from 'node:crypto';

// ── In-Memory State ──────────────────────────────────────────────────────────
// Map<roomId, RoomState>
const rooms = new Map();

// Map<clientIp, { count: number, resetAt: number }> for join brute-force defense
const failedJoinsByIp = new Map();

const ROOM_TTL_MS = 10 * 60 * 1000; // 10 minutes room max inactivity
const MAX_FAILED_JOINS = 5;
const FAILED_JOIN_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const MAX_SIGNAL_PAYLOAD_BYTES = 64 * 1024; // 64 KB max for SDP/ICE metadata

const ROOM_PREFIXES = ['LAB', 'DOC', 'P2P', 'NET', 'AIR', 'SYNC'];

/**
 * Generates an easily readable 6-character room code (e.g. LAB-402, P2P-891).
 * @returns {string}
 */
export function generateRoomCode() {
  for (let attempt = 0; attempt < 50; attempt++) {
    const prefix = ROOM_PREFIXES[Math.floor(Math.random() * ROOM_PREFIXES.length)];
    const num = Math.floor(100 + Math.random() * 900); // 3-digit number 100-999
    const code = `${prefix}-${num}`;
    if (!rooms.has(code)) {
      return code;
    }
  }
  // Fallback if saturated: alphanumeric 6-char
  return 'ROOM-' + randomBytes(2).toString('hex').toUpperCase();
}

/**
 * Generates an ephemeral random peer ID.
 * @returns {string}
 */
export function generatePeerId() {
  return 'peer_' + randomBytes(4).toString('hex');
}

/**
 * Checks and records rate-limiting for failed join attempts.
 * @param {string} ip
 * @returns {boolean} true if IP is rate-limited
 */
function isJoinRateLimited(ip) {
  const now = Date.now();
  const record = failedJoinsByIp.get(ip);
  if (!record) return false;
  if (now > record.resetAt) {
    failedJoinsByIp.delete(ip);
    return false;
  }
  return record.count >= MAX_FAILED_JOINS;
}

function recordFailedJoin(ip) {
  const now = Date.now();
  const record = failedJoinsByIp.get(ip) || { count: 0, resetAt: now + FAILED_JOIN_WINDOW_MS };
  record.count++;
  failedJoinsByIp.set(ip, record);
}

/**
 * Parses JSON request body.
 * @param {import('node:http').IncomingMessage} req
 * @param {number} maxBytes
 * @returns {Promise<any>}
 */
function readJsonBody(req, maxBytes = MAX_SIGNAL_PAYLOAD_BYTES) {
  return new Promise((resolve, reject) => {
    let raw = '';
    let size = 0;
    req.on('data', chunk => {
      size += chunk.length;
      if (size > maxBytes) {
        reject(new Error('PAYLOAD_TOO_LARGE'));
        return;
      }
      raw += chunk;
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (err) {
        reject(new Error('INVALID_JSON'));
      }
    });
    req.on('error', reject);
  });
}

/**
 * Broadcasts an SSE event to a specific response stream.
 * @param {import('node:http').ServerResponse} res
 * @param {string} event
 * @param {any} data
 */
function sendSseEvent(res, event, data) {
  if (res.writableEnded || res.destroyed) return;
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

/**
 * Handles all /api/v1/p2p/* signaling routes.
 *
 * @param {import('node:http').IncomingMessage} req
 * @param {import('node:http').ServerResponse} res
 * @param {string} pathname
 * @param {Function} sendJson
 * @returns {Promise<boolean>} true if handled
 */
export async function handleP2pSignalingRoutes(req, res, pathname, sendJson) {
  if (!pathname.startsWith('/api/v1/p2p')) {
    return false;
  }

  const method = req.method;
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || '127.0.0.1';

  // ── POST /api/v1/p2p/rooms — Create a new room ─────────────────────────────
  if (pathname === '/api/v1/p2p/rooms' && method === 'POST') {
    const roomId = generateRoomCode();
    const peerId = generatePeerId();

    const room = {
      id: roomId,
      createdAt: Date.now(),
      lastActive: Date.now(),
      peers: new Map([
        [peerId, { peerId, role: 'host', sseRes: null, lastSeen: Date.now() }]
      ]),
      queuedSignals: []
    };

    rooms.set(roomId, room);

    sendJson(201, {
      ok: true,
      roomId,
      peerId,
      role: 'host',
      message: 'Ephemeral P2P room created. Waiting for counterpart peer.'
    });
    return true;
  }

  // ── POST /api/v1/p2p/rooms/:roomId/join — Join an existing room ────────────
  const joinMatch = pathname.match(/^\/api\/v1\/p2p\/rooms\/([A-Za-z0-9_-]+)\/join$/);
  if (joinMatch && method === 'POST') {
    const targetRoomId = joinMatch[1].toUpperCase();

    if (isJoinRateLimited(ip)) {
      sendJson(429, {
        error: { code: 'RATE_LIMITED', message: 'Too many failed join attempts. Please wait a few minutes.' }
      });
      return true;
    }

    const room = rooms.get(targetRoomId);
    if (!room) {
      recordFailedJoin(ip);
      sendJson(404, {
        error: { code: 'ROOM_NOT_FOUND', message: `Room '${targetRoomId}' does not exist or has expired.` }
      });
      return true;
    }

    // Check if room is full (WebRTC direct P2P is 2 peers)
    if (room.peers.size >= 2) {
      sendJson(409, {
        error: { code: 'ROOM_FULL', message: `Room '${targetRoomId}' already has 2 active peers.` }
      });
      return true;
    }

    const peerId = generatePeerId();
    room.lastActive = Date.now();
    room.peers.set(peerId, { peerId, role: 'joiner', sseRes: null, lastSeen: Date.now() });

    // Notify the host peer that a joiner arrived
    for (const [existingId, p] of room.peers.entries()) {
      if (existingId !== peerId && p.sseRes) {
        sendSseEvent(p.sseRes, 'peer-joined', { peerId, role: 'joiner', totalPeers: 2 });
      }
    }

    sendJson(200, {
      ok: true,
      roomId: targetRoomId,
      peerId,
      role: 'joiner',
      message: 'Joined room successfully. Establishing WebRTC signaling.'
    });
    return true;
  }

  // ── GET /api/v1/p2p/rooms/:roomId/events — SSE Signaling Channel ───────────
  const sseMatch = pathname.match(/^\/api\/v1\/p2p\/rooms\/([A-Za-z0-9_-]+)\/events$/);
  if (sseMatch && method === 'GET') {
    const targetRoomId = sseMatch[1].toUpperCase();
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const peerId = url.searchParams.get('peerId');

    const room = rooms.get(targetRoomId);
    if (!room || !peerId || !room.peers.has(peerId)) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Room or peer not found');
      return true;
    }

    // Establish SSE stream
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'X-Accel-Buffering': 'no',
    });

    const peerObj = room.peers.get(peerId);
    peerObj.sseRes = res;
    peerObj.lastSeen = Date.now();
    room.lastActive = Date.now();

    // Send initial greeting event
    sendSseEvent(res, 'room-ready', {
      roomId: targetRoomId,
      peerId,
      role: peerObj.role,
      totalPeers: room.peers.size
    });

    // If both peers are already connected, notify both to kick off negotiation
    if (room.peers.size === 2) {
      for (const [, p] of room.peers.entries()) {
        if (p.sseRes) {
          sendSseEvent(p.sseRes, 'peers-connected', {
            roomId: targetRoomId,
            initiatorId: Array.from(room.peers.keys())[0],
            joinerId: Array.from(room.peers.keys())[1],
            isInitiator: p.role === 'host'
          });
        }
      }
    }

    // Deliver any queued signals targeted for this peer
    if (room.queuedSignals && room.queuedSignals.length > 0) {
      const remaining = [];
      for (const sig of room.queuedSignals) {
        if (sig.targetId === peerId || !sig.targetId) {
          sendSseEvent(res, 'signal', sig);
        } else {
          remaining.push(sig);
        }
      }
      room.queuedSignals = remaining;
    }

    const heartbeatInterval = setInterval(() => {
      if (res.writableEnded || res.destroyed) {
        clearInterval(heartbeatInterval);
        return;
      }
      res.write(': keep-alive\n\n');
    }, 25000);
    if (heartbeatInterval.unref) {
      heartbeatInterval.unref();
    }

    // Handle client disconnection
    req.on('close', () => {
      clearInterval(heartbeatInterval);
      peerObj.sseRes = null;
      room.lastActive = Date.now();

      // Notify counterpart
      for (const [otherId, otherPeer] of room.peers.entries()) {
        if (otherId !== peerId && otherPeer.sseRes) {
          sendSseEvent(otherPeer.sseRes, 'peer-left', { peerId });
        }
      }

      // If room is empty or both peers disconnected, clean up
      let hasActiveSse = false;
      for (const p of room.peers.values()) {
        if (p.sseRes && !p.sseRes.writableEnded) hasActiveSse = true;
      }
      if (!hasActiveSse) {
        rooms.delete(targetRoomId);
      }
    });

    return true;
  }

  // ── POST /api/v1/p2p/rooms/:roomId/signal — Relay SDP Offer/Answer/ICE ─────
  const signalMatch = pathname.match(/^\/api\/v1\/p2p\/rooms\/([A-Za-z0-9_-]+)\/signal$/);
  if (signalMatch && method === 'POST') {
    const targetRoomId = signalMatch[1].toUpperCase();
    const room = rooms.get(targetRoomId);

    if (!room) {
      sendJson(404, { error: { code: 'ROOM_NOT_FOUND', message: 'Room not found.' } });
      return true;
    }

    let body;
    try {
      body = await readJsonBody(req);
    } catch (err) {
      sendJson(err.message === 'PAYLOAD_TOO_LARGE' ? 413 : 400, {
        error: { code: err.message, message: 'Invalid signal payload.' }
      });
      return true;
    }

    const { senderId, type, payload } = body;
    if (!senderId || !type || !payload) {
      sendJson(400, { error: { code: 'INVALID_SIGNAL', message: 'senderId, type, and payload required.' } });
      return true;
    }

    room.lastActive = Date.now();

    // Find recipient peer (the other peer in room)
    let forwarded = false;
    for (const [pId, p] of room.peers.entries()) {
      if (pId !== senderId) {
        if (p.sseRes && !p.sseRes.writableEnded) {
          sendSseEvent(p.sseRes, 'signal', { senderId, type, payload });
          forwarded = true;
        } else {
          // Queue signal if target peer has not finished connecting SSE stream yet
          if (!room.queuedSignals) room.queuedSignals = [];
          if (room.queuedSignals.length < 30) {
            room.queuedSignals.push({ senderId, targetId: pId, type, payload });
          }
        }
      }
    }

    sendJson(200, { ok: true, forwarded });
    return true;
  }

  // ── POST /api/v1/p2p/rooms/:roomId/leave — Leave Room Gracefully ───────────
  const leaveMatch = pathname.match(/^\/api\/v1\/p2p\/rooms\/([A-Za-z0-9_-]+)\/leave$/);
  if (leaveMatch && method === 'POST') {
    const targetRoomId = leaveMatch[1].toUpperCase();
    const room = rooms.get(targetRoomId);
    if (room) {
      let body = {};
      try { body = await readJsonBody(req, 1024); } catch {}
      const peerId = body.peerId;

      if (peerId && room.peers.has(peerId)) {
        room.peers.delete(peerId);
        for (const p of room.peers.values()) {
          if (p.sseRes) {
            sendSseEvent(p.sseRes, 'peer-left', { peerId });
          }
        }
      }

      if (room.peers.size === 0) {
        rooms.delete(targetRoomId);
      }
    }

    sendJson(200, { ok: true });
    return true;
  }

  return false;
}

// ── Inactive Rooms Reclaim Daemon ─────────────────────────────────────────────
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [roomId, room] of rooms.entries()) {
    if (now - room.lastActive > ROOM_TTL_MS) {
      // Close all SSE streams in room
      for (const p of room.peers.values()) {
        if (p.sseRes && !p.sseRes.writableEnded) {
          sendSseEvent(p.sseRes, 'room-expired', { message: 'Room has expired due to inactivity.' });
          p.sseRes.end();
        }
      }
      rooms.delete(roomId);
    }
  }

  // Clean rate-limit records
  for (const [ip, rec] of failedJoinsByIp.entries()) {
    if (now > rec.resetAt) {
      failedJoinsByIp.delete(ip);
    }
  }
}, 60000);

if (cleanupInterval.unref) {
  cleanupInterval.unref(); // Don't prevent process from exiting in tests
}

/**
 * Returns active room count (used for testing and health monitoring).
 */
export function getActiveRoomCount() {
  return rooms.size;
}

/**
 * Clears all rooms (strictly for test isolation).
 */
export function clearAllP2pRoomsForTesting() {
  rooms.clear();
  failedJoinsByIp.clear();
}
