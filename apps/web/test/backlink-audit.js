/**
 * Comprehensive Backlink & Tool Contract Audit Script
 * Verifies every tool in DocPlatform:
 * 1. Registered in Core TOOL_REGISTRY & getToolContract
 * 2. Registered in Web Client tool-registry.js
 * 3. Featured / Listed in Landing Page TOOLS_CATALOG
 * 4. Present in Layout Mega-Menu
 * 5. Servable via HTTP route on server.js without 404
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { TOOL_REGISTRY, getToolContract } from '@doc-platform/core';

const landingPageSrc = fs.readFileSync(path.resolve('apps/web/views/landing-page.js'), 'utf8');
const layoutSrc = fs.readFileSync(path.resolve('apps/web/views/layout.js'), 'utf8');
const clientRegistrySrc = fs.readFileSync(path.resolve('apps/web/public/modules/tool-registry.js'), 'utf8');

async function testUrl(slug) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:3000${slug.startsWith('/') ? slug : '/' + slug}`, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          hasTitle: data.includes('<title>') && !data.includes('404 - Tool Not Found'),
          contentLength: data.length
        });
      });
    });
    req.on('error', (err) => resolve({ statusCode: 500, error: err.message }));
  });
}

async function runAudit() {
  console.log('--- DOCPLATFORM TOOLS & BACKLINKS AUDIT REPORT ---');
  const allToolKeys = Object.keys(TOOL_REGISTRY);
  console.log(`Total Tools in Core Registry: ${allToolKeys.length}`);

  const report = [];

  const ROUTE_ALIASES = {
    'image-to-pdf': 'jpg-to-pdf',
    'gst-invoice': 'gst-invoice-pdf',
    'pos-billing': 'pos-billing',
    'clean-billing': 'pos-billing',
    'tax-receipt': 'tax-receipt',
    'estimate-maker': 'estimate-maker',
    'chat-with-pdf': 'ai-ask',
    'summarize-pdf': 'ai-summarize',
    'organize-pages': 'delete-pdf-pages',
    'crop-pdf': 'crop-pdf',
    'resize-pdf': 'crop-pdf',
    'pdf-to-audio': 'ai-summarize',
    'edit-pdf': 'edit-pdf',
    'pdf-editor': 'edit-pdf',
    'sign-pdf': 'draw-signature',
    'add-watermark': 'watermark-pdf',
    'page-numbers': 'page-numbers-pdf',
    'headers-footers': 'page-numbers-pdf',
    'extract-text': 'ocr-pdf',
    'extract-tables': 'ai-extract-table',
    'extract-pages': 'extract-pages',
    'split-pages': 'split-pdf',
    'flatten-pdf': 'flatten-pdf',
    'repair-pdf': 'repair-pdf',
    'encrypt-pdf': 'protect-pdf',
    'remove-password': 'unlock-pdf',
    'privacy-scanner': 'strip-metadata-pdf',
    'fingerprint-pdf': 'watermark-pdf',
    'compare-pdfs': 'compare-pdf',
    'p2p': 'p2p-share',
    'p2p-transfer': 'p2p-share',
    'airdrop': 'p2p-share',
    'air-drop': 'p2p-share',
  };

  // Reverse mapping from canonical toolKey to all known slugs
  const toolToSlugs = {};
  for (const key of allToolKeys) {
    toolToSlugs[key] = [key];
  }
  for (const [alias, target] of Object.entries(ROUTE_ALIASES)) {
    if (!toolToSlugs[target]) toolToSlugs[target] = [target];
    if (!toolToSlugs[target].includes(alias)) toolToSlugs[target].push(alias);
  }

  for (const key of allToolKeys) {
    const contract = getToolContract(key);
    const slug = contract.slug || key;
    const urlSlug = `/${slug}`;
    const allSlugs = toolToSlugs[key] || [key];

    const inCore = Boolean(TOOL_REGISTRY[key]);
    const inClientRegistry = clientRegistrySrc.includes(`'${key}':`) || clientRegistrySrc.includes(`"${key}":`);
    const inLandingCatalog = allSlugs.some(s => landingPageSrc.includes(`/${s}`) || landingPageSrc.includes(s));
    const inMegaMenu = allSlugs.some(s => layoutSrc.includes(`/${s}`));

    const httpCheck = await testUrl(urlSlug);

    report.push({
      toolKey: key,
      slug: urlSlug,
      mode: contract.mode,
      wideCanvas: contract.wideCanvas,
      inCore,
      inClientRegistry,
      inLandingCatalog,
      inMegaMenu,
      httpStatus: httpCheck.statusCode,
      httpOk: httpCheck.statusCode === 200 && httpCheck.hasTitle
    });
  }

  console.table(report);

  const brokenHttp = report.filter(r => !r.httpOk);
  const missingLanding = report.filter(r => !r.inLandingCatalog);
  const missingMega = report.filter(r => !r.inMegaMenu);

  console.log('\n--- SUMMARY ---');
  console.log(`Total Tools Audited: ${report.length}`);
  console.log(`HTTP 200 Active Routes: ${report.length - brokenHttp.length} / ${report.length}`);
  console.log(`In Landing Catalog: ${report.length - missingLanding.length} / ${report.length}`);
  console.log(`In Mega-Menu: ${report.length - missingMega.length} / ${report.length}`);

  if (brokenHttp.length > 0) {
    console.error('Broken HTTP Routes:', brokenHttp.map(r => r.toolKey));
  }
  if (missingLanding.length > 0) {
    console.warn('Tools not in Landing Catalog:', missingLanding.map(r => r.toolKey));
  }
  if (missingMega.length > 0) {
    console.warn('Tools not in Mega-Menu:', missingMega.map(r => r.toolKey));
  }
}

runAudit();
