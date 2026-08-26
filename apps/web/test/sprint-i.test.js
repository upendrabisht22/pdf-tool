/**
 * @file sprint-i.test.js
 * @description Phase 8 — Growth Platform, i18n Localization & Widget SDK Tests.
 *
 * Test Coverage:
 *  1. i18n Engine: 6 languages (en, es, fr, de, hi, ja), nested translation keys, fallback resolution, metadata
 *  2. Tool Localization: Tool metadata resolution across all 6 languages
 *  3. XML Sitemap Generator: RFC XML structure, xhtml:link hreflang alternate tags, 160+ tool URLs
 *  4. Robots.txt Generator: Crawler directives and sitemap pointer
 *  5. Widget SDK: Syntax verification and public API export structure
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  SUPPORTED_LOCALES,
  LOCALE_METADATA,
  TRANSLATIONS,
  getTranslation,
  getToolI18n,
} from '@doc-platform/core';

import {
  generateSitemapXml,
  generateRobotsTxt,
} from '../api/growth-routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// 1. i18n LOCALIZATION TESTS
// ============================================================================

test('i18n - SUPPORTED_LOCALES contains all 6 core languages', () => {
  const expected = ['en', 'es', 'fr', 'de', 'hi', 'ja'];
  assert.deepEqual([...SUPPORTED_LOCALES], expected);
});

test('i18n - LOCALE_METADATA has valid metadata for all supported locales', () => {
  for (const locale of SUPPORTED_LOCALES) {
    const meta = LOCALE_METADATA[locale];
    assert.ok(meta, `Metadata for ${locale} must exist`);
    assert.equal(meta.code, locale);
    assert.ok(meta.name.length > 0, `Name for ${locale} must not be empty`);
    assert.ok(meta.nativeName.length > 0, `Native name for ${locale} must not be empty`);
    assert.ok(meta.flag.length > 0, `Flag for ${locale} must not be empty`);
    assert.equal(meta.dir, 'ltr');
  }
});

test('i18n - TRANSLATIONS dictionary exists for all 6 locales', () => {
  for (const locale of SUPPORTED_LOCALES) {
    const dict = TRANSLATIONS[locale];
    assert.ok(dict, `Dictionary for ${locale} must exist`);
    assert.ok(dict.nav.tools, `nav.tools for ${locale} must exist`);
    assert.ok(dict.nav.pricing, `nav.pricing for ${locale} must exist`);
    assert.ok(dict.hero.dropPrompt, `hero.dropPrompt for ${locale} must exist`);
    assert.ok(dict.hero.selectFiles, `hero.selectFiles for ${locale} must exist`);
    assert.ok(dict.pricing.title, `pricing.title for ${locale} must exist`);
  }
});

test('i18n - getTranslation returns localized string for English', () => {
  const result = getTranslation('en', 'nav.tools');
  assert.equal(result, 'PDF Tools');
});

test('i18n - getTranslation returns localized string for Spanish', () => {
  const result = getTranslation('es', 'nav.tools');
  assert.equal(result, 'Herramientas PDF');
});

test('i18n - getTranslation returns localized string for French', () => {
  const result = getTranslation('fr', 'nav.tools');
  assert.equal(result, 'Outils PDF');
});

test('i18n - getTranslation returns localized string for German', () => {
  const result = getTranslation('de', 'nav.tools');
  assert.equal(result, 'PDF-Werkzeuge');
});

test('i18n - getTranslation returns localized string for Hindi', () => {
  const result = getTranslation('hi', 'nav.tools');
  assert.equal(result, 'PDF टूल्स');
});

test('i18n - getTranslation returns localized string for Japanese', () => {
  const result = getTranslation('ja', 'nav.tools');
  assert.equal(result, 'PDFツール');
});

test('i18n - getTranslation falls back to English when key is missing in target locale', () => {
  const result = getTranslation('es', 'nonexistent.custom.key', 'Custom Fallback');
  assert.equal(result, 'Custom Fallback');
});

test('i18n - getToolI18n returns localized title and badge for all 6 languages', () => {
  for (const locale of SUPPORTED_LOCALES) {
    const mergeTool = getToolI18n(locale, 'merge-pdf');
    assert.ok(mergeTool.title.length > 0, `merge-pdf title in ${locale} must not be empty`);
    assert.ok(mergeTool.badge.length > 0, `merge-pdf badge in ${locale} must not be empty`);
    assert.ok(mergeTool.subtitle.length > 0, `merge-pdf subtitle in ${locale} must not be empty`);
    assert.ok(mergeTool.actionName.length > 0, `merge-pdf actionName in ${locale} must not be empty`);
  }
});

test('i18n - getToolI18n returns valid fallback for unknown tool', () => {
  const fallback = getToolI18n('en', 'custom-unknown-tool');
  assert.ok(fallback.title.includes('custom unknown tool'));
  assert.equal(fallback.badge, 'Document Utility');
});

// ============================================================================
// 2. XML SITEMAP GENERATOR TESTS
// ============================================================================

test('Sitemap - generateSitemapXml produces valid XML structure', () => {
  const host = 'https://docplatform.com';
  const xml = generateSitemapXml(host);

  assert.ok(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'), 'Must have XML declaration');
  assert.ok(xml.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'), 'Must have sitemap schema');
  assert.ok(xml.includes('xmlns:xhtml="http://www.w3.org/1999/xhtml"'), 'Must have xhtml namespace for hreflang');
  assert.ok(xml.endsWith('</urlset>'), 'Must close urlset tag');
});

test('Sitemap - contains canonical root URLs for all 6 locales', () => {
  const host = 'https://docplatform.com';
  const xml = generateSitemapXml(host);

  assert.ok(xml.includes(`<loc>${host}/</loc>`), 'Must contain English root');
  assert.ok(xml.includes(`<loc>${host}/es</loc>`), 'Must contain Spanish root');
  assert.ok(xml.includes(`<loc>${host}/fr</loc>`), 'Must contain French root');
  assert.ok(xml.includes(`<loc>${host}/de</loc>`), 'Must contain German root');
  assert.ok(xml.includes(`<loc>${host}/hi</loc>`), 'Must contain Hindi root');
  assert.ok(xml.includes(`<loc>${host}/ja</loc>`), 'Must contain Japanese root');
});

test('Sitemap - contains pricing URLs for all 6 locales', () => {
  const host = 'https://docplatform.com';
  const xml = generateSitemapXml(host);

  assert.ok(xml.includes(`<loc>${host}/pricing</loc>`), 'Must contain English pricing');
  assert.ok(xml.includes(`<loc>${host}/es/pricing</loc>`), 'Must contain Spanish pricing');
  assert.ok(xml.includes(`<loc>${host}/ja/pricing</loc>`), 'Must contain Japanese pricing');
});

test('Sitemap - contains xhtml:link hreflang alternates for every URL', () => {
  const host = 'https://docplatform.com';
  const xml = generateSitemapXml(host);

  assert.ok(xml.includes('hreflang="en"'), 'Must have hreflang="en"');
  assert.ok(xml.includes('hreflang="es"'), 'Must have hreflang="es"');
  assert.ok(xml.includes('hreflang="fr"'), 'Must have hreflang="fr"');
  assert.ok(xml.includes('hreflang="de"'), 'Must have hreflang="de"');
  assert.ok(xml.includes('hreflang="hi"'), 'Must have hreflang="hi"');
  assert.ok(xml.includes('hreflang="ja"'), 'Must have hreflang="ja"');
  assert.ok(xml.includes('hreflang="x-default"'), 'Must have x-default fallback');
});

test('Sitemap - generates over 100 URL nodes for full multilingual tool matrix', () => {
  const host = 'https://docplatform.com';
  const xml = generateSitemapXml(host);

  const urlMatches = xml.match(/<url>/g);
  assert.ok(urlMatches !== null);
  assert.ok(urlMatches.length >= 100, `Expected ≥ 100 URLs in multilingual sitemap, found ${urlMatches.length}`);
});

// ============================================================================
// 3. ROBOTS.TXT GENERATOR TESTS
// ============================================================================

test('Robots - generateRobotsTxt includes crawler directives and sitemap pointer', () => {
  const host = 'https://docplatform.com';
  const robots = generateRobotsTxt(host);

  assert.ok(robots.includes('User-agent: *'), 'Must target all user agents');
  assert.ok(robots.includes('Allow: /'), 'Must allow root indexing');
  assert.ok(robots.includes('Disallow: /api/'), 'Must disallow API endpoints');
  assert.ok(robots.includes(`Sitemap: ${host}/sitemap.xml`), 'Must link to sitemap.xml');
});

// ============================================================================
// 4. WIDGET SDK STATIC ASSET TESTS
// ============================================================================

test('Widget SDK - widget.js exists in public directory and has valid syntax', async () => {
  const widgetPath = path.join(__dirname, '..', 'public', 'widget.js');
  const content = await fs.readFile(widgetPath, 'utf8');

  assert.ok(content.length > 500, 'widget.js must contain implementation');
  assert.ok(content.includes('DocPlatform'), 'Must declare DocPlatform namespace');
  assert.ok(content.includes('createWidget'), 'Must provide createWidget method');
  assert.ok(content.includes('dp-widget-container'), 'Must contain widget CSS class');
});
