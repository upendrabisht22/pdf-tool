/**
 * @file seo.ts
 * @description Programmatic SEO schemas, OpenGraph helpers, and JSON-LD structured data generators.
 */

export interface ToolSeoConfig {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  keywords: string[];
  features: string[];
  howToSteps: { name: string; text: string }[];
  faqs: { question: string; answer: string }[];
}

export const TOOL_REGISTRY: Record<string, ToolSeoConfig> = {
  'merge-pdf': {
    slug: 'merge-pdf',
    title: 'Merge PDF Online',
    metaTitle: 'Merge PDF Online — Combine Multiple PDF Files Free | DocPlatform',
    metaDescription: 'Combine multiple PDF files into one secure document in seconds. Instant local browser processing with zero cloud data storage and complete privacy.',
    canonicalUrl: 'https://docplatform.app/merge-pdf',
    keywords: ['merge pdf', 'combine pdf', 'join pdf files', 'pdf merger free', 'combine pdf online'],
    features: [
      'Zero-upload client-side processing for ultimate speed and privacy',
      'Drag-and-drop file reordering with live page preview',
      'Preserves high-resolution images, bookmarks, and form fields',
      '100% free with no file limits or watermarks',
    ],
    howToSteps: [
      { name: 'Upload PDFs', text: 'Select and drag your PDF documents into the drop zone.' },
      { name: 'Arrange Order', text: 'Drag files or pages to set your desired reading order.' },
      { name: 'Merge & Download', text: 'Click "Merge PDF" to combine instantly and download your unified document.' },
    ],
    faqs: [
      { question: 'Is my data safe when merging PDFs?', answer: 'Yes. Lightweight merges are processed locally right in your browser. Your files never leave your computer unless you explicitly choose cloud processing.' },
      { question: 'How many PDF files can I combine at once?', answer: 'You can merge up to 50 files simultaneously for free.' },
      { question: 'Will combining PDFs reduce document quality?', answer: 'No. The original vector fidelity, fonts, and embedded images are preserved with zero degradation.' },
    ],
  },
  'split-pdf': {
    slug: 'split-pdf',
    title: 'Split PDF Online',
    metaTitle: 'Split PDF Online — Extract & Separate Pages Free | DocPlatform',
    metaDescription: 'Split a PDF into individual pages or extract specific page ranges instantly. Fast, private, and secure document extraction.',
    canonicalUrl: 'https://docplatform.app/split-pdf',
    keywords: ['split pdf', 'extract pdf pages', 'separate pdf', 'pdf splitter online'],
    features: [
      'Split by custom page ranges (e.g. 1-5, 8, 11-14)',
      'Extract every single page into separate standalone files',
      'Instant client-side extraction with zero lag',
    ],
    howToSteps: [
      { name: 'Upload PDF', text: 'Drop your PDF file into the splitter.' },
      { name: 'Select Pages', text: 'Choose your desired page ranges or split every page.' },
      { name: 'Download', text: 'Download your extracted PDF files individually or as a ZIP archive.' },
    ],
    faqs: [
      { question: 'Can I extract non-consecutive pages?', answer: 'Yes! Simply specify ranges like 1-3, 5, 8-10 in the split configuration.' },
    ],
  },
  'compress-pdf': {
    slug: 'compress-pdf',
    title: 'Compress PDF Online',
    metaTitle: 'Compress PDF Online — Reduce PDF File Size Free | DocPlatform',
    metaDescription: 'Reduce your PDF file size while maintaining crystal clear text and image quality. Choose from Extreme, Recommended, or Low compression levels.',
    canonicalUrl: 'https://docplatform.app/compress-pdf',
    keywords: ['compress pdf', 'reduce pdf size', 'shrink pdf', 'pdf compressor online free'],
    features: [
      'Three intelligent compression levels tailored for email and web',
      'Smart vector preservation ensuring crisp, readable typography',
      'Real-time compression ratio and size savings calculator',
    ],
    howToSteps: [
      { name: 'Upload PDF', text: 'Select the PDF file you want to shrink.' },
      { name: 'Choose Preset', text: 'Select Extreme, Recommended, or High Quality compression.' },
      { name: 'Download', text: 'Get your lightweight PDF ready for email and sharing.' },
    ],
    faqs: [
      { question: 'How much can I reduce my PDF size?', answer: 'Most PDFs are reduced between 40% and 85% depending on embedded images and fonts.' },
    ],
  },
  'rotate-pdf': {
    slug: 'rotate-pdf',
    title: 'Rotate PDF Online',
    metaTitle: 'Rotate PDF Online — Permanently Rotate PDF Pages 90° / 180° | DocPlatform',
    metaDescription: 'Rotate individual or all pages in your PDF document permanently. Rotate clockwise, counterclockwise, or upside-down with instant browser preview.',
    canonicalUrl: 'https://docplatform.app/rotate-pdf',
    keywords: ['rotate pdf', 'rotate pdf pages', 'turn pdf permanently', 'rotate pdf online'],
    features: [
      'Rotate individual pages or entire documents 90°, 180°, or 270°',
      'Interactive visual thumbnail rotation',
      'Permanent orientation saving',
    ],
    howToSteps: [
      { name: 'Upload PDF', text: 'Drag your PDF into the rotation canvas.' },
      { name: 'Rotate Pages', text: 'Click rotate on specific thumbnails or rotate all pages at once.' },
      { name: 'Save', text: 'Download your correctly oriented PDF document.' },
    ],
    faqs: [
      { question: 'Is the rotation permanent?', answer: 'Yes, when downloaded, the new page orientation is permanently encoded into the PDF structure.' },
    ],
  },
  'delete-pdf-pages': {
    slug: 'delete-pdf-pages',
    title: 'Delete PDF Pages',
    metaTitle: 'Delete PDF Pages Online — Remove Unwanted Pages Free | DocPlatform',
    metaDescription: 'Easily select and remove unwanted pages from your PDF file. Download a clean, optimized document in seconds.',
    canonicalUrl: 'https://docplatform.app/delete-pdf-pages',
    keywords: ['delete pdf pages', 'remove pages from pdf', 'cut pdf pages'],
    features: [
      'Visual page grid selection for one-click deletion',
      'Undo and restore capability before exporting',
      'Zero server upload required for local files',
    ],
    howToSteps: [
      { name: 'Upload PDF', text: 'Upload the document you want to edit.' },
      { name: 'Select Pages', text: 'Click the trash icon on the pages you want to remove.' },
      { name: 'Export', text: 'Click "Save Changes" to download your trimmed PDF.' },
    ],
    faqs: [
      { question: 'Can I delete multiple pages at once?', answer: 'Yes, select as many pages as you want to discard.' },
    ],
  },
  'jpg-to-pdf': {
    slug: 'jpg-to-pdf',
    title: 'JPG to PDF Converter',
    metaTitle: 'JPG to PDF Converter — Convert Images to PDF Online Free | DocPlatform',
    metaDescription: 'Convert JPG, PNG, and WebP images into a single organized PDF document. Set margins, orientation, and page size easily.',
    canonicalUrl: 'https://docplatform.app/jpg-to-pdf',
    keywords: ['jpg to pdf', 'image to pdf', 'convert png to pdf', 'photos to pdf'],
    features: [
      'Combine multiple image formats (JPG, PNG, WebP) into one document',
      'Automatic orientation adjustment (Portrait or Landscape)',
      'Custom margin and page size controls (A4, Letter, Fit Image)',
    ],
    howToSteps: [
      { name: 'Upload Images', text: 'Drag and drop one or more images into the converter.' },
      { name: 'Adjust Settings', text: 'Choose page size, orientation, and margin preferences.' },
      { name: 'Generate PDF', text: 'Download your compiled PDF document instantly.' },
    ],
    faqs: [
      { question: 'Can I reorder my images before converting?', answer: 'Yes, drag and drop the image thumbnails to reorder them in any sequence.' },
    ],
  },
  'pdf-to-jpg': {
    slug: 'pdf-to-jpg',
    title: 'PDF to JPG Converter',
    metaTitle: 'PDF to JPG Converter — Convert PDF Pages to High-Res Images | DocPlatform',
    metaDescription: 'Extract all pages from your PDF and convert them into high-resolution JPG or PNG images. Instant download individually or as a ZIP.',
    canonicalUrl: 'https://docplatform.app/pdf-to-jpg',
    keywords: ['pdf to jpg', 'convert pdf to image', 'pdf to png', 'extract images from pdf'],
    features: [
      'High-DPI rendering for ultra-crisp image output',
      'Export to JPG, PNG, or modern WebP format',
      'Batch download all extracted pages in a single ZIP',
    ],
    howToSteps: [
      { name: 'Upload PDF', text: 'Select the PDF document to convert.' },
      { name: 'Choose Format', text: 'Pick JPG or PNG and select your desired DPI resolution.' },
      { name: 'Download', text: 'Download individual images or get all pages in a ZIP archive.' },
    ],
    faqs: [
      { question: 'What is the maximum image resolution?', answer: 'We support standard 150 DPI for web and 300 DPI for high-resolution print reproduction.' },
    ],
  },
};

/**
 * Generates JSON-LD Structured Data for Google Search Engine Optimization
 */
export function generateToolJsonLd(config: ToolSeoConfig) {
  const webAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: config.title,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'All',
    url: config.canonicalUrl,
    description: config.metaDescription,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };

  const howToSchema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: `How to ${config.title}`,
    step: config.howToSteps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
    })),
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: config.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return {
    webAppSchema,
    howToSchema,
    faqSchema,
  };
}
