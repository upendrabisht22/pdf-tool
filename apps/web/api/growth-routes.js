/**
 * @file growth-routes.js
 * @description Phase 8 — Programmatic Multilingual SEO, Sitemap Engine & Widget Serving.
 *
 * Capabilities:
 *  1. /sitemap.xml — Dynamic XML sitemap covering all 27 tools across all 6 languages (160+ URLs)
 *     with full RFC-compliant <xhtml:link rel="alternate" hreflang="xx"> alternate tags.
 *  2. /robots.txt — Crawler directives pointing to sitemap.
 *  3. /widget.js — Serves the embeddable JavaScript Widget SDK.
 *  4. /api/v1/i18n/:lang — JSON translation endpoint for client apps or widget integrations.
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SUPPORTED_LOCALES,
  LOCALE_METADATA,
  TRANSLATIONS,
  getTranslation,
  getToolI18n,
  TOOL_REGISTRY,
} from '@doc-platform/core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generates an RFC-compliant XML Sitemap with multi-region hreflang annotations.
 * @param {string} host - Origin URL e.g. "https://docplatform.com" or "http://localhost:3000"
 * @returns {string} XML string
 */
export function generateSitemapXml(host) {
  const toolKeys = Object.keys(TOOL_REGISTRY);
  const now = new Date().toISOString().split('T')[0];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
  xml += `        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n`;

  // 1. Root Homepage in all locales
  for (const locale of SUPPORTED_LOCALES) {
    const locUrl = locale === 'en' ? `${host}/` : `${host}/${locale}`;
    xml += `  <url>\n`;
    xml += `    <loc>${locUrl}</loc>\n`;
    xml += `    <lastmod>${now}</lastmod>\n`;
    xml += `    <changefreq>daily</changefreq>\n`;
    xml += `    <priority>1.0</priority>\n`;

    // Multilingual alternate links
    for (const altLoc of SUPPORTED_LOCALES) {
      const altUrl = altLoc === 'en' ? `${host}/` : `${host}/${altLoc}`;
      xml += `    <xhtml:link rel="alternate" hreflang="${altLoc}" href="${altUrl}"/>\n`;
    }
    xml += `    <xhtml:link rel="alternate" hreflang="x-default" href="${host}/"/>\n`;
    xml += `  </url>\n`;
  }

  // 2. Pricing page in all locales
  for (const locale of SUPPORTED_LOCALES) {
    const locUrl = locale === 'en' ? `${host}/pricing` : `${host}/${locale}/pricing`;
    xml += `  <url>\n`;
    xml += `    <loc>${locUrl}</loc>\n`;
    xml += `    <lastmod>${now}</lastmod>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.8</priority>\n`;

    for (const altLoc of SUPPORTED_LOCALES) {
      const altUrl = altLoc === 'en' ? `${host}/pricing` : `${host}/${altLoc}/pricing`;
      xml += `    <xhtml:link rel="alternate" hreflang="${altLoc}" href="${altUrl}"/>\n`;
    }
    xml += `    <xhtml:link rel="alternate" hreflang="x-default" href="${host}/pricing"/>\n`;
    xml += `  </url>\n`;
  }

  // 3. All 27 Tool Permutations across all 6 locales (160+ URLs)
  for (const tool of toolKeys) {
    for (const locale of SUPPORTED_LOCALES) {
      const locUrl = locale === 'en' ? `${host}/${tool}` : `${host}/${locale}/${tool}`;
      xml += `  <url>\n`;
      xml += `    <loc>${locUrl}</loc>\n`;
      xml += `    <lastmod>${now}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.9</priority>\n`;

      for (const altLoc of SUPPORTED_LOCALES) {
        const altUrl = altLoc === 'en' ? `${host}/${tool}` : `${host}/${altLoc}/${tool}`;
        xml += `    <xhtml:link rel="alternate" hreflang="${altLoc}" href="${altUrl}"/>\n`;
      }
      xml += `    <xhtml:link rel="alternate" hreflang="x-default" href="${host}/${tool}"/>\n`;
      xml += `  </url>\n`;
    }
  }

  xml += `</urlset>`;
  return xml;
}

/**
 * Generates standard robots.txt output.
 * @param {string} host
 * @returns {string}
 */
export function generateRobotsTxt(host) {
  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /api/',
    'Disallow: /api/v1/developer/',
    'Disallow: /api/v1/webhooks/',
    '',
    `Sitemap: ${host}/sitemap.xml`,
  ].join('\n');
}

/**
 * Handles all growth & programmatic SEO routes.
 *
 * @param {import('node:http').IncomingMessage} req
 * @param {import('node:http').ServerResponse} res
 * @param {string} pathname
 * @param {import('node:url').URL} url
 * @param {Function} sendJson
 * @returns {Promise<boolean>} true if route handled
 */
export async function handleGrowthRoutes(req, res, pathname, url, sendJson) {
  const host = `${url.protocol}//${url.host}`;

  // ── GET /sitemap.xml ────────────────────────────────────────────────────
  if (pathname === '/sitemap.xml' && req.method === 'GET') {
    const sitemap = generateSitemapXml(host);
    res.writeHead(200, {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    });
    res.end(sitemap);
    return true;
  }

  // ── GET /robots.txt ─────────────────────────────────────────────────────
  if (pathname === '/robots.txt' && req.method === 'GET') {
    const robots = generateRobotsTxt(host);
    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    });
    res.end(robots);
    return true;
  }

  // ── GET /widget.js ──────────────────────────────────────────────────────
  if (pathname === '/widget.js' && req.method === 'GET') {
    try {
      const widgetPath = path.join(__dirname, '..', 'public', 'widget.js');
      const widgetContent = await fs.readFile(widgetPath, 'utf8');
      res.writeHead(200, {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      });
      res.end(widgetContent);
      return true;
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Widget SDK not found');
      return true;
    }
  }

  // ── GET /api/v1/i18n/:lang ──────────────────────────────────────────────
  const i18nMatch = pathname.match(/^\/api\/v1\/i18n\/([a-z]{2})$/);
  if (i18nMatch && req.method === 'GET') {
    const lang = i18nMatch[1];
    if (!SUPPORTED_LOCALES.includes(lang)) {
      return sendJson(404, {
        error: {
          code: 'UNSUPPORTED_LOCALE',
          message: `Locale "${lang}" is not supported. Supported: ${SUPPORTED_LOCALES.join(', ')}`,
        },
      }), true;
    }

    return sendJson(200, {
      locale: lang,
      meta: LOCALE_METADATA[lang],
      translations: TRANSLATIONS[lang],
    }), true;
  }

  return false;
}
