/**
 * @file server.js
 * @description Production HTTP Server & Control Plane Dispatcher for DocPlatform (v2.3).
 *
 * Coordinates modular route dispatchers (static, API, SSR), background worker loops,
 * security middleware, and TTL garbage collection.
 */

import * as http from 'node:http';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  LocalStorageProvider,
  InMemoryQueueProvider,
  DefaultAuthProvider,
} from '@doc-platform/providers';
import { SandboxedWorkerHarness } from '@doc-platform/workers';
import { applyRateLimit } from './security/rate-limiter.js';
import { startTtlCleanupDaemon } from './security/job-ttl.js';
import { startWorkerLoop } from './workers/job-runner.js';
import { handleStaticRoutes } from './routes/static-routes.js';
import { handleApiRoutes } from './routes/api-routes.js';
import { handleSsrRoutes } from './routes/ssr-routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3000;
const publicDir = path.join(__dirname, 'public');
const storageDir = path.join(__dirname, '.storage');

// Initialize Providers and Worker Harness
const storageProvider = new LocalStorageProvider(storageDir, '/api/v1/storage/local');
const queueProvider = new InMemoryQueueProvider();
const authProvider = new DefaultAuthProvider();
const sandbox = new SandboxedWorkerHarness({ defaultTimeoutMs: 60000 });

// Start Background Worker Loop and TTL Cleanup Daemon
startWorkerLoop({ queueProvider, storageProvider, sandbox });
startTtlCleanupDaemon(queueProvider, storageProvider);

// HTTP Server
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  // JSON Response Helper
  const sendJson = (statusCode, data) => {
    res.writeHead(statusCode, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Session-Id',
    });
    res.end(JSON.stringify(data));
  };

  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Session-Id',
    });
    res.end();
    return;
  }

  // Security Middleware: Rate Limiting
  if (applyRateLimit(req, res, pathname)) return;

  // 1. Static Asset Routes (CSS, client modules, images, vendor libraries, widget)
  if (await handleStaticRoutes(req, res, pathname, publicDir)) return;

  // 2. Control Plane & Domain API Routes (health, jobs, files, developer, webhooks, p2p, growth)
  if (await handleApiRoutes(req, res, pathname, url, sendJson, { storageProvider, queueProvider, authProvider })) return;

  // 3. Server-Side Rendered (SSR) Web Pages (Landing, static pages, tool studios, 404)
  if (await handleSsrRoutes(req, res, pathname)) return;
});

server.listen(PORT, () => {
  console.log(`DocPlatform production server running on http://localhost:${PORT}`);
});
