/**
 * @file routes/static-routes.js
 * @description Static asset serving handler for CSS, client ES modules, vendor libs, and images.
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';

/**
 * Handles incoming requests for static files.
 * @param {import('node:http').IncomingMessage} req
 * @param {import('node:http').ServerResponse} res
 * @param {string} pathname
 * @param {string} publicDir - Absolute path to public directory
 * @returns {Promise<boolean>} True if the request was handled, false otherwise
 */
export async function handleStaticRoutes(req, res, pathname, publicDir) {
  // Serve Static CSS
  if (pathname === '/styles.css') {
    try {
      const css = await fs.readFile(path.join(publicDir, 'styles.css'));
      res.writeHead(200, {
        'Content-Type': 'text/css; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      });
      res.end(css);
      return true;
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Stylesheet Not Found');
      return true;
    }
  }

  // Serve Static Client App JS
  if (pathname === '/app.js') {
    try {
      const js = await fs.readFile(path.join(publicDir, 'app.js'));
      res.writeHead(200, {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      });
      res.end(js);
      return true;
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('App Script Not Found');
      return true;
    }
  }

  // Serve Static Client ES Modules
  if (pathname.startsWith('/modules/')) {
    const safePath = path.normalize(path.join(publicDir, pathname));
    if (safePath.startsWith(path.join(publicDir, 'modules'))) {
      try {
        const mod = await fs.readFile(safePath);
        res.writeHead(200, {
          'Content-Type': 'application/javascript; charset=utf-8',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        });
        res.end(mod);
        return true;
      } catch {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Module Not Found');
        return true;
      }
    }
  }

  // Serve Static Vendor Files (GSAP, ScrollSmoother, etc.)
  if (pathname.startsWith('/vendor/')) {
    const safePath = path.normalize(path.join(publicDir, pathname));
    if (safePath.startsWith(path.join(publicDir, 'vendor'))) {
      try {
        const file = await fs.readFile(safePath);
        const ext = path.extname(safePath).toLowerCase();
        const contentType = ext === '.css'
          ? 'text/css'
          : (ext === '.js' ? 'application/javascript; charset=utf-8' : 'application/octet-stream');
        res.writeHead(200, {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400',
        });
        res.end(file);
        return true;
      } catch {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Vendor File Not Found');
        return true;
      }
    }
  }

  // Serve Direct QR Download Endpoint
  if (pathname === '/download-qr' || pathname === '/images/download-qr') {
    try {
      const file = await fs.readFile(path.join(publicDir, 'images', 'wcode-razorpay-qr.jpg'));
      res.writeHead(200, {
        'Content-Type': 'image/jpeg',
        'Content-Disposition': 'attachment; filename="wcode-pdf-tool-upi-qr.jpg"',
        'Cache-Control': 'public, max-age=86400',
      });
      res.end(file);
      return true;
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('QR Poster Not Found');
      return true;
    }
  }

  // Serve Static Images (QR Codes, Brand Badges, Posters)
  if (pathname.startsWith('/images/')) {
    const safePath = path.normalize(path.join(publicDir, pathname));
    if (safePath.startsWith(path.join(publicDir, 'images'))) {
      try {
        const file = await fs.readFile(safePath);
        const ext = path.extname(safePath).toLowerCase();
        const mimeTypes = {
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.webp': 'image/webp',
          '.svg': 'image/svg+xml',
          '.ico': 'image/x-icon',
          '.gif': 'image/gif'
        };
        const contentType = mimeTypes[ext] || 'application/octet-stream';
        res.writeHead(200, {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400',
        });
        res.end(file);
        return true;
      } catch {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Image Not Found');
        return true;
      }
    }
  }

  // Serve Static Widget SDK
  if (pathname === '/widget.js') {
    try {
      const widget = await fs.readFile(path.join(publicDir, 'widget.js'));
      res.writeHead(200, {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Cache-Control': 'public, max-age=86400',
      });
      res.end(widget);
      return true;
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Widget Not Found');
      return true;
    }
  }

  return false;
}
