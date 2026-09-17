/**
 * DocPlatform Architectural Minimalist Landing Page View
 * DocPlatform Blueprint System (Client-Side Privacy Engine):
 * - Architectural dashed blueprint framing (max-w-5xl border-x border-dashed border-border)
 * - Typography: Instrument Serif for hero headlines, JetBrains Mono for monospace labels/cards, Plus Jakarta Sans for body
 * - Exact 3-layer folded origami paper graphic with polygon clip paths & signature SVG
 * - 3-Column dashed value props: Clean, Free & Unlimited, Safe & Local
 * - Bento spotlights: GST Tax Invoice Studio & College Lab P2P Share
 * - 3-Column sharp rectangular tool directory with instant real-time search & category filter
 * - Architectural CTA banner with 4 corner brackets & sliding violet hover fill button
 * - 4-Column dashed footer with product, company, and connect links
 */

const TOOLS_CATALOG = [
  {
    slug: '/merge-pdf',
    title: 'Merge PDF',
    desc: 'Combine multiple PDFs into one file',
    category: 'core',
    featured: true,
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7b61ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11.35 22H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.706.706l3.588 3.588A2.4 2.4 0 0 1 20 8v5.35"></path><path d="M14 2v5a1 1 0 0 0 1 1h5"></path><path d="M14 19h6"></path><path d="M17 16v6"></path></svg>`
  },
  {
    slug: '/split-pdf',
    title: 'Split PDF',
    desc: 'Extract pages or split into parts',
    category: 'core',
    featured: true,
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7b61ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"></circle><path d="M8.12 8.12 12 12"></path><path d="M20 4 8.12 15.88"></path><circle cx="6" cy="18" r="3"></circle><path d="M14.8 14.8 20 20"></path></svg>`
  },
  {
    slug: '/compress-pdf',
    title: 'Compress PDF',
    desc: 'Reduce file size without losing quality',
    category: 'core',
    featured: true,
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7b61ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m14 10 7-7"></path><path d="M20 10h-6V4"></path><path d="m3 21 7-7"></path><path d="M4 14h6v6"></path></svg>`
  },
  {
    slug: '/rotate-pdf',
    title: 'Rotate PDF',
    desc: 'Fix sideways or upside-down pages',
    category: 'core',
    featured: false,
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7b61ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path></svg>`
  },
  {
    slug: '/organize-pages',
    title: 'Organize Pages',
    desc: 'Reorder, delete or rearrange pages',
    category: 'core',
    featured: false,
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7b61ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"></path><path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12"></path><path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17"></path></svg>`
  },
  {
    slug: '/crop-pdf',
    title: 'Crop & Resize',
    desc: 'Trim margins or resize pages',
    category: 'core',
    featured: false,
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7b61ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2v14a2 2 0 0 0 2 2h14"></path><path d="M18 22V8a2 2 0 0 0-2-2H2"></path></svg>`
  },
  {
    slug: '/pdf-to-jpg',
    title: 'PDF to JPG',
    desc: 'Export pages as high-quality images',
    category: 'conversions',
    featured: true,
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7b61ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect><circle cx="9" cy="9" r="2"></circle><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path></svg>`
  },
  {
    slug: '/jpg-to-pdf',
    title: 'Images to PDF',
    desc: 'Convert JPG or PNG to PDF',
    category: 'conversions',
    featured: true,
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7b61ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22h6a2 2 0 0 0 2-2V8a2.4 2.4 0 0 0-.706-1.706l-3.588-3.588A2.4 2.4 0 0 0 14 2H6a2 2 0 0 0-2 2v6"></path><path d="M14 2v5a1 1 0 0 0 1 1h5"></path><path d="M3 16v-1.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 .5.5V16"></path><path d="M6 22h2"></path><path d="M7 14v8"></path></svg>`
  },
  {
    slug: '/word-to-pdf',
    title: 'Word to PDF',
    desc: 'Convert .docx files to PDF',
    category: 'conversions',
    featured: false,
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7b61ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"></path><path d="M14 2v5a1 1 0 0 0 1 1h5"></path><path d="M10 9H8"></path><path d="M16 13H8"></path><path d="M16 17H8"></path></svg>`
  },
  {
    slug: '/pdf-to-word',
    title: 'PDF to Word',
    desc: 'Export PDF as editable .docx',
    category: 'conversions',
    featured: false,
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7b61ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"></path><path d="M14 2v5a1 1 0 0 0 1 1h5"></path><path d="M12 18v-6"></path><path d="m9 15 3 3 3-3"></path></svg>`
  },
  {
    slug: '/excel-to-pdf',
    title: 'Excel to PDF',
    desc: 'Convert spreadsheets to PDF',
    category: 'conversions',
    featured: false,
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7b61ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"></path><path d="M14 2v5a1 1 0 0 0 1 1h5"></path><path d="M8 13h2"></path><path d="M14 13h2"></path><path d="M8 17h2"></path><path d="M14 17h2"></path></svg>`
  },
  {
    slug: '/markdown-to-pdf',
    title: 'Markdown to PDF',
    desc: 'Convert .md to formatted PDF',
    category: 'conversions',
    featured: false,
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7b61ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"></path><path d="M14 2v5a1 1 0 0 0 1 1h5"></path><path d="M10 12.5 8 15l2 2.5"></path><path d="m14 12.5 2 2.5-2 2.5"></path></svg>`
  },
  {
    slug: '/edit-pdf',
    title: 'Edit & Sign PDF',
    desc: 'Draw signature or add text to document',
    category: 'security',
    featured: true,
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7b61ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v16"></path><path d="M4 7V5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2"></path><path d="M9 20h6"></path></svg>`
  },
  {
    slug: '/add-watermark',
    title: 'Add Watermark',
    desc: 'Stamp text or image on pages',
    category: 'security',
    featured: false,
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7b61ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"></path><path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97"></path></svg>`
  },
  {
    slug: '/page-numbers',
    title: 'Page Numbers',
    desc: 'Auto-number pages with custom positioning',
    category: 'security',
    featured: false,
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7b61ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="20" y1="9" y2="9"></line><line x1="4" x2="20" y1="15" y2="15"></line><line x1="10" x2="8" y1="3" y2="21"></line><line x1="16" x2="14" y1="3" y2="21"></line></svg>`
  },
  {
    slug: '/redact-pdf',
    title: 'Redact PDF',
    desc: 'Permanently remove sensitive text & data',
    category: 'security',
    featured: false,
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7b61ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"></path><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"></path><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"></path><path d="m2 2 20 20"></path></svg>`
  },
  {
    slug: '/extract-text',
    title: 'Extract Text',
    desc: 'Copy all text from any PDF document',
    category: 'ai',
    featured: false,
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7b61ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"></path><path d="M14 2v5a1 1 0 0 0 1 1h5"></path><path d="M10 9H8"></path><path d="M16 13H8"></path><path d="M16 17H8"></path></svg>`
  },
  {
    slug: '/ocr-pdf',
    title: 'OCR PDF',
    desc: 'Make scanned PDFs searchable & editable',
    category: 'ai',
    featured: true,
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7b61ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"></path><path d="M17 3h2a2 2 0 0 1 2 2v2"></path><path d="M21 17v2a2 2 0 0 1-2 2h-2"></path><path d="M7 21H5a2 2 0 0 1-2-2v-2"></path><path d="M7 12h10"></path></svg>`
  },
  {
    slug: '/repair-pdf',
    title: 'Repair PDF',
    desc: 'Recover corrupted or broken PDF files',
    category: 'core',
    featured: false,
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7b61ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z"></path></svg>`
  },
  {
    slug: '/flatten-pdf',
    title: 'Flatten PDF',
    desc: 'Remove form fields & make pages static',
    category: 'core',
    featured: false,
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7b61ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 13.74a2 2 0 0 1-2 0L2.5 8.87a1 1 0 0 1 0-1.74L11 2.26a2 2 0 0 1 2 0l8.5 4.87a1 1 0 0 1 0 1.74z"></path><path d="m20 14.285 1.5.845a1 1 0 0 1 0 1.74L13 21.74a2 2 0 0 1-2 0l-8.5-4.87a1 1 0 0 1 0-1.74l1.5-.845"></path></svg>`
  },
  {
    slug: '/encrypt-pdf',
    title: 'Encrypt PDF',
    desc: 'Password-protect with AES-256 encryption',
    category: 'security',
    featured: false,
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7b61ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`
  },
  {
    slug: '/remove-password',
    title: 'Remove Password',
    desc: 'Unlock and decrypt protected PDFs',
    category: 'security',
    featured: false,
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7b61ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>`
  },
  {
    slug: '/privacy-scanner',
    title: 'Privacy Scanner',
    desc: 'Find and purge hidden tracking metadata',
    category: 'security',
    featured: false,
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7b61ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path></svg>`
  },
  {
    slug: '/chat-with-pdf',
    title: 'Chat with PDF',
    desc: 'Ask AI questions and cite source pages',
    category: 'ai',
    featured: true,
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7b61ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z"></path></svg>`
  },
  {
    slug: '/summarize-pdf',
    title: 'Summarize PDF',
    desc: 'Get an AI executive brief instantly',
    category: 'ai',
    featured: false,
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7b61ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"></path><path d="M9 13a4.5 4.5 0 0 0 3-4"></path><path d="M12 13h4"></path><path d="M12 18h6a2 2 0 0 1 2 2v1"></path></svg>`
  },
  {
    slug: '/compare-pdfs',
    title: 'Compare PDFs',
    desc: 'Side-by-side visual and text diffing',
    category: 'ai',
    featured: false,
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7b61ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="18" r="3"></circle><circle cx="6" cy="6" r="3"></circle><path d="M13 6h3a2 2 0 0 1 2 2v7"></path><path d="M11 18H8a2 2 0 0 1-2-2V9"></path></svg>`
  },
  {
    slug: '/gst-invoice',
    title: 'GST Tax Invoice',
    desc: 'Generate 100% compliant Indian GST invoices',
    category: 'business',
    featured: true,
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7b61ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17V7"></path><path d="M16 8h-6a2 2 0 0 0 0 4h4a2 2 0 0 1 0 4H8"></path><path d="M4 3a1 1 0 0 1 1-1 1.3 1.3 0 0 1 .7.2l.933.6a1.3 1.3 0 0 0 1.4 0l.934-.6a1.3 1.3 0 0 1 1.4 0l.933.6a1.3 1.3 0 0 0 1.4 0l.933-.6a1.3 1.3 0 0 1 1.4 0l.934.6a1.3 1.3 0 0 0 1.4 0l.933-.6A1.3 1.3 0 0 1 19 2a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1 1.3 1.3 0 0 1-.7-.2l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.934.6a1.3 1.3 0 0 1-1.4 0l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-1.4 0l-.934-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-.7.2 1 1 0 0 1-1-1z"></path></svg>`
  },
  {
    slug: '/pos-billing',
    title: 'POS Billing',
    desc: 'Thermal receipts and fast counter billing',
    category: 'business',
    featured: false,
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7b61ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"></circle><circle cx="19" cy="21" r="1"></circle><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path></svg>`
  }
];

export function renderLandingPage() {
  const featuredTools = TOOLS_CATALOG.filter(t => t.featured);
  const allTools = TOOLS_CATALOG;

  return `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>DocPlatform — Architecture-Grade PDF & Document Studio</title>
  <meta name="description" content="30+ free, precision PDF and document tools. 100% in-browser, no uploads, no sign-up, zero watermarks. Built with architectural minimalism." />
  <meta name="keywords" content="pdf tools, merge pdf, split pdf, gst invoice generator, private pdf suite, webassembly pdf, ocr pdf" />
  <link rel="canonical" href="https://docplatform.app/" />

  <!-- Preconnect & Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  
  <link rel="stylesheet" href="/styles.css?v=3.1" />

  <!-- Tailwind CSS CDN for DocPlatform Architectural Blueprint Utilities -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: ['class', '[data-theme="dark"]'],
      theme: {
        extend: {
          colors: {
            border: 'var(--border)',
            'border-hover': 'var(--border-hover)',
            bg: 'var(--bg)',
            'bg-base': 'var(--bg-base)',
            'bg-subtle': 'var(--bg-subtle)',
            'bg-elevated': 'var(--bg-elevated)',
            accent: 'var(--accent)',
            'accent-hover': 'var(--accent-hover)',
            'accent-foreground': 'var(--accent-foreground)',
            'text-primary': 'var(--text-primary)',
            'text-secondary': 'var(--text-secondary)',
            'text-muted': 'var(--text-muted)',
          },
          fontFamily: {
            display: ['"Instrument Serif"', 'Georgia', 'serif'],
            mono: ['"JetBrains Mono"', 'monospace'],
            sans: ['"Plus Jakarta Sans"', 'sans-serif'],
          }
        }
      }
    }
  </script>

  <style>
    /* Inlined Blueprint Grid & Layout Utilities */
    .blueprint-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 12px;
      background-color: transparent;
      border: none;
    }
    .tool-blueprint-card {
      background-color: var(--bg-elevated);
      border: 1px solid var(--border);
      padding: 1.15rem 1.25rem;
      text-decoration: none;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 110px;
      transition: all 0.18s ease;
      position: relative;
    }
    .tool-blueprint-card:hover {
      background-color: var(--bg-subtle);
      border-color: #7b61ff;
    }
    .tool-blueprint-card:hover .tool-arrow {
      transform: translate(2px, -2px);
      color: #7b61ff;
    }

    /* Mobile Responsive Optimizations */
    @media (max-width: 640px) {
      .blueprint-grid {
        grid-template-columns: 1fr;
      }
      .hero-title-responsive {
        font-size: 2.75rem !important;
        line-height: 1.05 !important;
      }
      .origami-container-mobile {
        display: none !important;
      }
    }
  </style>
</head>
<body class="min-h-screen flex flex-col bg-bg text-text-primary antialiased">

  <!-- ========================================================================
       1. TOP ARCHITECTURAL FIXED NAVBAR
       ======================================================================== -->
  <header class="site-header fixed top-0 left-0 right-0 z-40 bg-bg/90 backdrop-blur-md" style="background: var(--bg-glass); width: 100%;">
    <div class="mx-auto flex h-[51px] max-w-5xl items-center justify-between gap-3 border-b border-x border-dashed border-border px-4 sm:px-6">
      
      <!-- Brand Logo -->
      <a class="flex items-center gap-2 text-text-primary hover:text-text-primary/80 transition-colors" href="/" aria-label="DocPlatform home">
        <div style="width: 24px; height: 24px; background: #7b61ff; border-radius: 3px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 11px; color: #ffffff; font-family: 'JetBrains Mono', monospace;">
          DP
        </div>
        <span class="hero-display text-xl font-bold tracking-tight text-text-primary">DocPlatform</span>
      </a>

      <!-- Monospace Navigation Links -->
      <nav class="mono-copy hidden md:flex items-center gap-1 text-xs text-text-secondary">
        <a class="px-2.5 py-1.5 transition-colors hover:text-text-primary hover:bg-bg-subtle" href="#featured-tools">Features</a>
        <a class="px-2.5 py-1.5 transition-colors hover:text-text-primary hover:bg-bg-subtle" href="#all-tools">Tools</a>
        <a class="px-2.5 py-1.5 transition-colors hover:text-text-primary hover:bg-bg-subtle" href="/pricing">Pricing</a>
      </nav>

      <!-- Actions: Theme Toggle & BYOK Key & GitHub -->
      <div class="flex items-center gap-2">
        <button type="button" onclick="toggleTheme()" class="mono-copy inline-flex items-center justify-center h-8 w-8 border border-border bg-bg-elevated text-text-secondary hover:text-text-primary transition-all cursor-pointer" aria-label="Toggle dark/light theme" title="Toggle theme">
          <svg id="theme-sun-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path></svg>
        </button>

        <a href="/merge-pdf" class="mono-copy inline-flex items-center gap-1.5 border border-transparent bg-accent text-accent-foreground px-3 py-1 text-[11px] font-medium hover:bg-accent-hover transition-all">
          <span>Get Started</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </a>
      </div>
    </div>
  </header>

  <!-- ========================================================================
       2. GSAP SCROLLSMOOTHER WRAPPER & MAIN CANVAS
       ======================================================================== -->
  <div id="smooth-wrapper">
    <div id="smooth-content" style="padding-top: 51px;">
      <main class="w-full flex-1">
    
    <!-- Hero Section -->
    <section class="mx-auto max-w-5xl border-x border-dashed border-border relative">
      <div class="relative flex min-h-fit md:min-h-[380px] flex-col justify-center overflow-hidden border-b border-dashed border-border py-14 px-6 sm:px-10">
        
        <!-- Architectural Linework Background -->
        <div class="linework pointer-events-none absolute inset-0"></div>

        <!-- Hero Content -->
        <div class="z-10 flex w-full max-w-3xl flex-col gap-4">
          
          <!-- Tool Count Badge + Gradient Divider -->
          <div class="flex items-center gap-3">
            <span class="mono-copy inline-flex items-center gap-1.5 border border-border bg-bg-elevated px-2.5 py-1 text-[11px] text-text-primary tracking-wide">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="#7b61ff" stroke="#7b61ff" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              ★ ${allTools.length} Free Tools
            </span>
            <div style="height: 1px; width: 120px; background: linear-gradient(to right, var(--border), transparent);"></div>
          </div>

          <!-- Editorial Instrument Serif Headline -->
          <div class="hero-display flex flex-col gap-1 text-5xl sm:text-7xl hero-title-responsive">
            <h1 class="text-text-secondary leading-[1.08]">
              <span>Everything your PDFs need,</span><br/>
              <span class="text-text-primary">in one click.</span>
            </h1>
          </div>

          <!-- Action Buttons -->
          <div class="mt-4 flex flex-wrap items-center gap-4 relative">
            <a href="/merge-pdf" class="paper-cta-btn group">
              <span class="cta-fill"></span>
              <span class="relative z-10 flex items-center gap-1.5">
                <span>Get Started</span>
                <svg height="14" width="14" viewBox="0 0 18 18" fill="currentColor" class="-rotate-45 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">
                  <g fill="currentColor">
                    <path d="M9 1C4.589 1 1 4.589 1 9C1 13.411 4.589 17 9 17C13.411 17 17 13.411 17 9C17 4.589 13.411 1 9 1Z" opacity="0.4"></path>
                    <path d="M8.47 11.72C8.177 12.013 8.177 12.488 8.47 12.781C8.616 12.927 8.808 13.001 9 13.001C9.192 13.001 9.384 12.928 9.53 12.781L12.78 9.53103C13.073 9.23803 13.073 8.76299 12.78 8.46999L9.53 5.21999C9.237 4.92699 8.762 4.92699 8.469 5.21999C8.176 5.51299 8.176 5.98803 8.469 6.28103L10.439 8.251H1.75C1.336 8.251 1 8.587 1 9.001C1 9.415 1.336 9.751 1.75 9.751H10.439L8.469 11.721L8.47 11.72Z"></path>
                  </g>
                </svg>
              </span>
            </a>

            <a href="#featured-tools" class="mono-copy inline-flex items-center gap-1.5 border border-border bg-bg-elevated text-text-primary px-4 py-2 text-xs font-medium hover:border-[#7b61ff] hover:text-[#7b61ff] transition-all">
              <span>Explore Tools</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
          </div>

          <!-- Monospace Tagline -->
          <p class="mono-copy mt-4 text-xs leading-relaxed text-text-secondary max-w-lg">
            No watermark. No upload. No sign-up. <br/>
            Your files never leave your browser WebAssembly sandbox.
          </p>
        </div>

      </div>

      <!-- 3-Column Value Props (Dashed Grid) -->
      <div class="grid grid-cols-1 sm:grid-cols-3 border-b border-dashed border-border divide-y sm:divide-y-0 sm:divide-x divide-dashed divide-border">
        
        <!-- Clean -->
        <div class="p-5 sm:p-6 flex flex-col gap-2 bg-bg">
          <h2 class="mono-copy flex items-center gap-2 text-sm font-medium text-text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7b61ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            Clean
          </h2>
          <p class="mono-copy text-xs leading-5 text-text-secondary">
            Clean PDF workflows with focused controls, clear outputs, and zero visual clutter.
          </p>
        </div>

        <!-- Free & Unlimited -->
        <div class="p-5 sm:p-6 flex flex-col gap-2 bg-bg">
          <h2 class="mono-copy flex items-center gap-2 text-sm font-medium text-text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7b61ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
            Free & Unlimited
          </h2>
          <p class="mono-copy text-xs leading-5 text-text-secondary">
            Merge, split, compress, convert, and export as often as you need with zero limits.
          </p>
        </div>

        <!-- Safe & Local -->
        <div class="p-5 sm:p-6 flex flex-col gap-2 bg-bg">
          <h2 class="mono-copy flex items-center gap-2 text-sm font-medium text-text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7b61ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            Safe & Local
          </h2>
          <p class="mono-copy text-xs leading-5 text-text-secondary">
            Files stay in your browser. No server uploads, no sign-up, and zero watermarks.
          </p>
        </div>

      </div>

      <!-- Bento Spotlight: GST Invoice Studio & College Lab Transfer -->
      <div class="p-6 sm:p-8 border-b border-dashed border-border bg-bg">
        <div class="mb-4">
          <span class="mono-copy text-[10px] uppercase tracking-widest text-[#7b61ff]">Platform Differentiators</span>
          <h2 class="hero-display text-2xl sm:text-3xl text-text-primary mt-1">Engineered for Indian Businesses & Student Labs</h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- GST Card -->
          <div class="border border-border bg-bg-elevated p-5 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between">
                <span class="mono-copy text-xs font-semibold text-text-primary flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7b61ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                  GST Tax Invoice Studio
                </span>
                <span class="mono-copy text-[10px] px-2 py-0.5 border border-[#7b61ff]/40 text-[#7b61ff] bg-[#7b61ff]/10">100% Valid</span>
              </div>
              <p class="mono-copy text-xs text-text-secondary mt-3 leading-relaxed">
                Generate authentic GST-compliant invoices formatted strictly for Indian B2B/B2C rules. Features live CGST/SGST/IGST auto-calculations, HSN/SAC table, and authentic verification QR.
              </p>
            </div>
            <div class="mt-5">
              <a href="/gst-invoice" class="mono-copy inline-flex items-center gap-1 text-xs font-medium text-[#7b61ff] hover:underline">
                <span>Launch GST Studio</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </a>
            </div>
          </div>

          <!-- P2P Transfer Card -->
          <div class="border border-border bg-bg-elevated p-5 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between">
                <span class="mono-copy text-xs font-semibold text-text-primary flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7b61ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                  College Lab P2P Share
                </span>
                <span class="mono-copy text-[10px] px-2 py-0.5 border border-emerald-500/40 text-emerald-400 bg-emerald-500/10">Zero Cloud</span>
              </div>
              <p class="mono-copy text-xs text-text-secondary mt-3 leading-relaxed">
                Direct browser-to-browser WebRTC encrypted file air-drop. Students can transfer 500MB+ assignments, records, and lab manuals across college Wi-Fi without logging in or using Google Drive.
              </p>
            </div>
            <div class="mt-5">
              <a href="/merge-pdf" class="mono-copy inline-flex items-center gap-1 text-xs font-medium text-[#7b61ff] hover:underline">
                <span>Start Direct Transfer</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </a>
            </div>
          </div>
        </div>
      </div>

    </section>

    <!-- ========================================================================
         3. TOOLS DIRECTORY (SEARCH, FILTERS, FEATURED & ALL TOOLS)
         ======================================================================== -->
    <section id="tools" class="mx-auto max-w-5xl border-x border-border px-4 py-8 pb-16">
      
      <!-- Search & Category Filter Bar -->
      <div class="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <!-- Search Input -->
        <div class="flex-1 relative">
          <input
            id="tool-search-input"
            type="text"
            placeholder="Search tools... (e.g. merge, compress, gst, word)"
            aria-label="Search tools"
            oninput="handleSearch(this.value)"
            class="mono-copy w-full h-10 px-3 pr-10 text-xs text-text-primary bg-bg-elevated border border-border outline-none focus:border-[#7b61ff] transition-all placeholder:text-text-muted"
          />
          <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </div>
        </div>

        <!-- Category Dropdown Filter -->
        <div class="relative shrink-0 w-full sm:w-[200px]">
          <select
            id="category-filter-select"
            onchange="handleCategoryChange(this.value)"
            class="mono-copy w-full h-10 px-3 text-xs font-medium text-text-primary bg-bg-elevated border border-border outline-none focus:border-[#7b61ff] cursor-pointer"
          >
            <option value="all">All Tools (${allTools.length})</option>
            <option value="core">Core PDF</option>
            <option value="conversions">Conversions</option>
            <option value="security">Security & Sign</option>
            <option value="ai">AI & OCR</option>
            <option value="business">Business & Tax</option>
          </select>
        </div>
      </div>

      <!-- Featured Tools Section -->
      <div id="featured-tools" class="space-y-4 mb-10" style="scroll-margin-top: 80px;">
        <div class="flex items-center justify-between">
          <h2 class="mono-copy text-xs font-semibold text-text-primary tracking-wider uppercase">Featured Tools</h2>
          <span class="mono-copy text-[10px] text-text-muted">Top Productivity Picks</span>
        </div>

        <div class="blueprint-grid" id="featured-grid">
          ${featuredTools.map(t => `
            <a href="${t.slug}" class="tool-blueprint-card group" data-category="${t.category}" data-title="${t.title.toLowerCase()}" data-desc="${t.desc.toLowerCase()}">
              <div>
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2.5">
                    ${t.icon}
                    <h3 class="mono-copy text-xs font-semibold text-text-primary group-hover:text-[#7b61ff] transition-colors">${t.title}</h3>
                  </div>
                  <svg class="tool-arrow text-text-muted transition-transform duration-150" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17l9.2-9.2M17 17V8H8"/></svg>
                </div>
                <p class="mono-copy mt-2 text-[11px] leading-4 text-text-secondary">${t.desc}</p>
              </div>
            </a>
          `).join('')}
        </div>
      </div>

      <!-- All Tools Directory Section -->
      <div id="all-tools" class="space-y-4" style="scroll-margin-top: 80px;">
        <div class="flex items-center justify-between">
          <h2 class="mono-copy text-xs font-semibold text-text-primary tracking-wider uppercase">All Tools (${allTools.length})</h2>
          <span class="mono-copy text-[10px] text-text-muted" id="tool-counter">${allTools.length} Available</span>
        </div>

        <div class="blueprint-grid" id="all-tools-grid">
          ${allTools.map(t => `
            <a href="${t.slug}" class="tool-blueprint-card group" data-category="${t.category}" data-title="${t.title.toLowerCase()}" data-desc="${t.desc.toLowerCase()}">
              <div>
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2.5">
                    ${t.icon}
                    <h3 class="mono-copy text-xs font-semibold text-text-primary group-hover:text-[#7b61ff] transition-colors">${t.title}</h3>
                  </div>
                  <svg class="tool-arrow text-text-muted transition-transform duration-150" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17l9.2-9.2M17 17V8H8"/></svg>
                </div>
                <p class="mono-copy mt-2 text-[11px] leading-4 text-text-secondary">${t.desc}</p>
              </div>
            </a>
          `).join('')}
        </div>

        <!-- No Results Fallback -->
        <div id="no-tools-found" class="hidden p-8 text-center border border-dashed border-border bg-bg-elevated">
          <p class="mono-copy text-xs text-text-secondary">No PDF tools match your query.</p>
          <button onclick="resetSearch()" class="mono-copy mt-3 text-xs text-[#7b61ff] underline cursor-pointer">Clear search query</button>
        </div>
      </div>

    </section>

    <!-- ========================================================================
         4. ARCHITECTURAL CTA BANNER WITH CORNER BRACKETS
         ======================================================================== -->
    <section class="mx-auto max-w-5xl border-x border-dashed border-border px-4 py-8">
      <div class="relative overflow-hidden border border-dashed border-border bg-bg-elevated/40 p-8 sm:p-14 text-center">
        
        <!-- 4 Corner Brackets ┌ ┐ └ ┘ -->
        <div class="corner-bracket-tl"></div>
        <div class="corner-bracket-tr"></div>
        <div class="corner-bracket-bl"></div>
        <div class="corner-bracket-br"></div>

        <!-- Ambient Violet Glow -->
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#7b61ff]/10 blur-[80px] rounded-full pointer-events-none"></div>

        <h2 class="hero-display text-3xl sm:text-5xl text-text-primary relative z-10 max-w-2xl mx-auto leading-tight">
          Ready to simplify your PDF workflows?
        </h2>

        <p class="mono-copy mt-4 text-xs text-text-secondary max-w-lg mx-auto relative z-10 leading-relaxed">
          Clean, fast, and architectural. Process your files directly in your browser without data retention or cloud exposure.
        </p>

        <div class="mt-8 relative z-10">
          <a href="/merge-pdf" class="paper-cta-btn group">
            <span class="cta-fill"></span>
            <span>Get started</span>
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </a>
        </div>

      </div>
    </section>

  </main>

  <!-- ========================================================================
       5. 4-COLUMN ARCHITECTURAL DASHED FOOTER
       ======================================================================== -->
  <footer class="mt-auto border-t border-dashed border-border bg-bg text-text-muted">
    <div class="mx-auto max-w-5xl border-x border-dashed border-border">
      
      <div class="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-dashed divide-border">
        
        <!-- Col 1: Brand -->
        <div class="p-6 flex flex-col justify-between gap-4">
          <div>
            <a class="flex items-center gap-2 text-text-primary" href="/">
              <div style="width: 22px; height: 22px; background: #7b61ff; border-radius: 3px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 10px; color: #ffffff; font-family: 'JetBrains Mono', monospace;">
                DP
              </div>
              <span class="hero-display text-lg font-bold text-text-primary">DocPlatform</span>
            </a>
            <p class="mono-copy text-[11px] text-text-secondary mt-3 leading-5">
              Precision tools for your PDF workflows. 100% private in-browser document processing.
            </p>
          </div>
          <div class="mono-copy text-[10px] text-text-muted">
            Designed for privacy & speed.
          </div>
        </div>

        <!-- Col 2: Product -->
        <div class="p-6 flex flex-col gap-2.5">
          <div class="mono-copy text-[10px] uppercase tracking-wider text-text-muted">Product</div>
          <a href="/merge-pdf" class="mono-copy text-xs text-text-secondary hover:text-text-primary transition-colors">PDF Tools</a>
          <a href="/gst-invoice" class="mono-copy text-xs text-text-secondary hover:text-text-primary transition-colors">GST Studio</a>
          <a href="/chat-with-pdf" class="mono-copy text-xs text-text-secondary hover:text-text-primary transition-colors">Chat with PDF</a>
          <a href="/ocr-pdf" class="mono-copy text-xs text-text-secondary hover:text-text-primary transition-colors">OCR Engine</a>
          <a href="/pricing" class="mono-copy text-xs text-text-secondary hover:text-text-primary transition-colors">Pricing</a>
        </div>

        <!-- Col 3: Company & Security -->
        <div class="p-6 flex flex-col gap-2.5">
          <div class="mono-copy text-[10px] uppercase tracking-wider text-text-muted">Company</div>
          <a href="/privacy" class="mono-copy text-xs text-text-secondary hover:text-text-primary transition-colors">Privacy First</a>
          <a href="/security" class="mono-copy text-xs text-text-secondary hover:text-text-primary transition-colors">Security Model</a>
          <a href="/terms" class="mono-copy text-xs text-text-secondary hover:text-text-primary transition-colors">Terms of Service</a>
        </div>

        <!-- Col 4: Architecture & Trust -->
        <div class="p-6 flex flex-col justify-between gap-4">
          <div class="flex flex-col gap-2.5">
            <div class="mono-copy text-[10px] uppercase tracking-wider text-text-muted">Architecture</div>
            <span class="mono-copy text-xs text-text-secondary">Client-Side WebAssembly</span>
            <span class="mono-copy text-xs text-text-secondary">Zero Server Retention</span>
            <span class="mono-copy text-xs text-text-secondary">Local RAM Sandbox</span>
          </div>

          <div class="mono-copy text-[10px] uppercase tracking-wider text-text-muted">
            100% Private Processing
          </div>
        </div>

      </div>

      <!-- Copyright Bar -->
      <div class="border-t border-dashed border-border px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] uppercase tracking-widest text-text-muted mono-copy">
        <div>© 2026 DOCPLATFORM. ALL RIGHTS RESERVED.</div>
        <div class="flex items-center gap-2">
          <span style="width: 4px; height: 4px; background: #7b61ff; border-radius: 50%;"></span>
          <span>CLIENT-SIDE PRIVACY ARCHITECTURE</span>
        </div>
      </div>

    </div>
  </footer>
    </div>
  </div>

  <!-- ========================================================================
       6. CLIENT-SIDE INTERACTIVITY SCRIPTS
       ======================================================================== -->
  <script>
    // Theme Management
    function toggleTheme() {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('dp_theme', next);
    }

    // Initialize Theme from localStorage
    (function initTheme() {
      const saved = localStorage.getItem('dp_theme') || 'dark';
      document.documentElement.setAttribute('data-theme', saved);
    })();

    // Live Search & Category Filtering
    let currentCategory = 'all';
    let currentQuery = '';

    function handleSearch(val) {
      currentQuery = (val || '').toLowerCase().trim();
      applyFilter();
    }

    function handleCategoryChange(cat) {
      currentCategory = cat;
      applyFilter();
    }

    function resetSearch() {
      const searchInput = document.getElementById('tool-search-input');
      const catSelect = document.getElementById('category-filter-select');
      if (searchInput) searchInput.value = '';
      if (catSelect) catSelect.value = 'all';
      currentQuery = '';
      currentCategory = 'all';
      applyFilter();
    }

    function applyFilter() {
      const allCards = document.querySelectorAll('#all-tools-grid .tool-blueprint-card');
      const featuredContainer = document.getElementById('featured-tools-container');
      let visibleCount = 0;

      // Hide featured section when searching
      if (featuredContainer) {
        if (currentQuery !== '' || currentCategory !== 'all') {
          featuredContainer.style.display = 'none';
        } else {
          featuredContainer.style.display = 'block';
        }
      }

      allCards.forEach(card => {
        const title = card.getAttribute('data-title') || '';
        const desc = card.getAttribute('data-desc') || '';
        const category = card.getAttribute('data-category') || '';

        const matchesQuery = currentQuery === '' || title.includes(currentQuery) || desc.includes(currentQuery);
        const matchesCategory = currentCategory === 'all' || category === currentCategory;

        if (matchesQuery && matchesCategory) {
          card.style.display = 'flex';
          visibleCount++;
        } else {
          card.style.display = 'none';
        }
      });

      const counterEl = document.getElementById('tool-counter');
      if (counterEl) {
        counterEl.textContent = visibleCount + ' Available';
      }

      const noResults = document.getElementById('no-tools-found');
      if (noResults) {
        noResults.style.display = visibleCount === 0 ? 'block' : 'none';
      }

      // Refresh ScrollSmoother layout height on filter
      if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.refresh();
      }
    }
  </script>

  <!-- GSAP Core, ScrollTrigger & ScrollSmoother Engine (Local Offline-First) -->
  <script src="/vendor/gsap/gsap.min.js"></script>
  <script src="/vendor/gsap/ScrollTrigger.min.js"></script>
  <script src="/vendor/gsap/ScrollSmoother.min.js"></script>
  <script>
    (function() {
      function initSmoother() {
        if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined' || typeof ScrollSmoother === 'undefined') return;
        if (window.smoother) return;

        gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

        const wrapper = document.getElementById('smooth-wrapper');
        const content = document.getElementById('smooth-content');
        if (!wrapper || !content) return;

        try {
          const smoother = ScrollSmoother.create({
            wrapper: '#smooth-wrapper',
            content: '#smooth-content',
            smooth: 1.15,
            effects: true,
            smoothTouch: 0.1,
            normalizeScroll: false,
            ignoreMobileResize: true
          });

          window.smoother = smoother;

          // Smooth anchor links with ScrollSmoother
          document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
              const href = this.getAttribute('href');
              if (href && href.length > 1) {
                const target = document.querySelector(href);
                if (target) {
                  e.preventDefault();
                  smoother.scrollTo(target, true, 'top 65px');
                }
              }
            });
          });
        } catch (err) {
          console.warn('ScrollSmoother initialization skipped:', err);
        }
      }

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSmoother);
      } else {
        initSmoother();
      }
    })();
  </script>

</body>
</html>`;
}
