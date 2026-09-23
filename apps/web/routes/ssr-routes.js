/**
 * @file routes/ssr-routes.js
 * @description Server-side rendering (SSR) route handler for landing, static legal/pricing pages,
 * and dynamic tool studio pages with JSON-LD SEO metadata.
 */

import { TOOL_REGISTRY, generateToolJsonLd, getToolContract } from '@doc-platform/core';
import { renderNavbar, renderFooter, renderGsapScripts } from '../views/layout.js';
import {
  renderPricingPage,
  renderPrivacyPage,
  renderTermsPage,
  renderSecurityPage,
  render404Page
} from '../views/static-pages.js';
import { renderAppPage, getToolCategory, getRelatedToolsList } from '../views/app-page.js';
import { renderLandingPage } from '../views/landing-page.js';

/**
 * Route aliases mapping friendly or legacy URLs to canonical tool registry keys.
 */
export const ROUTE_ALIASES = {
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

/**
 * Handles SSR page requests for all user-facing views.
 * @param {import('node:http').IncomingMessage} req
 * @param {import('node:http').ServerResponse} res
 * @param {string} pathname
 * @returns {Promise<boolean>}
 */
export async function handleSsrRoutes(req, res, pathname) {
  // Route: Dedicated /pricing Page
  if (pathname === '/pricing') {
    const pricingHtml = renderPricingPage({ renderNavbar, renderFooter, renderGsapScripts });
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(pricingHtml);
    return true;
  }

  // Route: Dedicated /privacy Page
  if (pathname === '/privacy') {
    const privacyHtml = renderPrivacyPage({ renderNavbar, renderFooter, renderGsapScripts });
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(privacyHtml);
    return true;
  }

  // Route: Dedicated /terms Page
  if (pathname === '/terms') {
    const termsHtml = renderTermsPage({ renderNavbar, renderFooter, renderGsapScripts });
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(termsHtml);
    return true;
  }

  // Route: Dedicated /security Page
  if (pathname === '/security') {
    const securityHtml = renderSecurityPage({ renderNavbar, renderFooter, renderGsapScripts });
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(securityHtml);
    return true;
  }

  // Route: Flagship SaaS Dark Landing Page (Root Route /)
  if (pathname === '/' || pathname === '') {
    const landingHtml = renderLandingPage({
      renderNavbar,
      renderFooter,
      TOOL_REGISTRY,
    });
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(landingHtml);
    return true;
  }

  // Serve Dedicated Tool Studio with Rich SEO & Structured Data
  // Normalize underscores to hyphens (e.g. /draw_signature → /draw-signature)
  const rawToolKey = pathname.replace(/^\//, '').replace(/_/g, '-');
  const currentToolKey = ROUTE_ALIASES[rawToolKey] || rawToolKey;
  const toolConfig = TOOL_REGISTRY[currentToolKey];

  if (!toolConfig) {
    const notFoundHtml = render404Page({ renderNavbar, renderFooter, renderGsapScripts });
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(notFoundHtml);
    return true;
  }

  const jsonLd = generateToolJsonLd(toolConfig);
  const category = getToolCategory(currentToolKey);
  const relatedSlugs = getRelatedToolsList(currentToolKey);

  const html = renderAppPage({
    toolConfig,
    jsonLd,
    category,
    relatedSlugs,
    renderNavbar,
    renderFooter,
    TOOL_REGISTRY,
    renderGsapScripts,
    currentToolKey,
    toolContract: getToolContract(currentToolKey),
  });

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
  return true;
}
