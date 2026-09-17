import test from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument } from 'pdf-lib';
import {
  PosBillingProcessor,
  TaxReceiptProcessor,
  EstimateMakerProcessor,
} from '../dist/index.js';

const mockContext = {
  jobId: 'job_biz_test_1',
  workerId: 'worker_biz_1',
  timeoutMs: 30000,
  maxMemoryBytes: 512 * 1024 * 1024,
  tempWorkingDir: '.',
  isCancelled: () => false,
  onProgress: async () => {},
};

test('Business Suite: PosBillingProcessor generates 80mm thermal slip with UPI QR', async () => {
  const processor = new PosBillingProcessor();
  const options = {
    storeName: 'Kaveri Provisions & Grocery',
    tagline: 'Fresh & Daily Essentials',
    storeAddress: '14/2 Commercial Street, Bangalore - 560001',
    storePhone: '+91 98765 43210',
    gstin: '29ABCDE1234F1Z5',
    receiptNumber: 'POS-2026-089',
    cashierName: 'Counter-01',
    paymentMode: 'UPI',
    upiId: 'kaveristore@okaxis',
    items: [
      { name: 'Organic Almond Milk 1L', qty: 2, price: 180, amount: 360 },
      { name: 'Cold Pressed Coconut Oil 500ml', qty: 1, price: 240, amount: 240 },
    ],
    taxRate: 5,
    discount: 50,
  };

  const result = await processor.process([], options, mockContext);
  assert.ok(result.outputFiles[0].buffer);
  assert.strictEqual(result.outputFiles[0].filename, 'pos_receipt_POS-2026-089.pdf');
  assert.strictEqual(result.outputFiles[0].mimeType, 'application/pdf');

  // Verify valid PDF magic bytes
  const buf = Buffer.from(result.outputFiles[0].buffer);
  assert.strictEqual(buf.subarray(0, 4).toString(), '%PDF');

  // Verify document can be loaded by pdf-lib
  const parsedDoc = await PDFDocument.load(buf);
  assert.strictEqual(parsedDoc.getPageCount(), 1);
  const pageSize = parsedDoc.getPage(0).getSize();
  assert.strictEqual(pageSize.width, 226.77); // 80mm
});

test('Business Suite: TaxReceiptProcessor generates official 80G tax exemption certificate', async () => {
  const processor = new TaxReceiptProcessor();
  const options = {
    trustName: 'Aarohan Foundation for Child Education',
    trustRegistrationNumber: 'TRUST/DL/2018/8891',
    section80GNumber: 'CIT(E)/DEL/80G/2021-22/A/1042',
    trustPan: 'AAATA4567K',
    trustAddress: 'Plot 42, Institutional Area, Sector 62, Noida 201309',
    signatoryName: 'Dr. Ramesh Chandra',
    signatoryTitle: 'Managing Trustee',
    receiptNumber: '80G-2026-1042',
    donationDate: '15/09/2026',
    financialYear: '2026-2027',
    donorName: 'Vikramaditya Sharma',
    donorPan: 'ABCPS1234M',
    donorAddress: 'C-402, Green Glen Heights, Bellandur, Bangalore - 560103',
    donorPhone: '+91 98450 11223',
    donationAmount: 25000,
    paymentMode: 'NEFT / Wire Transfer',
    transactionRef: 'NEFT-HDFC-9921827361',
    cause: 'Underprivileged Children Primary School Library Setup',
  };

  const result = await processor.process([], options, mockContext);
  assert.ok(result.outputFiles[0].buffer);
  assert.strictEqual(result.outputFiles[0].filename, 'tax_receipt_80G-2026-1042.pdf');
  assert.strictEqual(result.outputFiles[0].mimeType, 'application/pdf');

  // Verify valid PDF magic bytes
  const buf = Buffer.from(result.outputFiles[0].buffer);
  assert.strictEqual(buf.subarray(0, 4).toString(), '%PDF');

  // Load and verify page structure
  const parsedDoc = await PDFDocument.load(buf);
  assert.strictEqual(parsedDoc.getPageCount(), 1);
  const pageSize = parsedDoc.getPage(0).getSize();
  assert.strictEqual(pageSize.width, 595.28); // A4 width
});

test('Business Suite: EstimateMakerProcessor generates formal proposal PDF', async () => {
  const processor = new EstimateMakerProcessor();
  const options = {
    estimateNumber: 'EST-2026-044',
    estimateDate: '16/09/2026',
    validUntil: '30/09/2026',
    fromName: 'Apex Architecture & Design Labs',
    fromAddress: 'Studio 12, Indiranagar, Bangalore - 560038',
    fromEmail: 'proposals@apexdesign.studio',
    fromPhone: '+91 80 4411 9900',
    toName: 'Horizon Fintech Inc.',
    toContact: 'Ms. Priya Menon, VP Engineering',
    toAddress: 'Level 8, Prestige Tech Park, Marathahalli, Bangalore',
    projectTitle: 'Corporate Headquarters Interior Architecture & Workspace Optimization',
    items: [
      { description: 'Spatial layout schematics & acoustic blueprinting', qty: 1, unitPrice: 120000, amount: 120000 },
      { description: 'Custom ergonomic modular workstation integration', qty: 24, unitPrice: 15000, amount: 360000 },
    ],
    taxRate: 18,
    discount: 20000,
    terms: '50% advance upon contract signing; 50% on deliverable handoff.',
  };

  const result = await processor.process([], options, mockContext);
  assert.ok(result.outputFiles[0].buffer);
  assert.strictEqual(result.outputFiles[0].filename, 'estimate_EST-2026-044.pdf');
  assert.strictEqual(result.outputFiles[0].mimeType, 'application/pdf');

  // Verify valid PDF magic bytes
  const buf = Buffer.from(result.outputFiles[0].buffer);
  assert.strictEqual(buf.subarray(0, 4).toString(), '%PDF');

  const parsedDoc = await PDFDocument.load(buf);
  assert.strictEqual(parsedDoc.getPageCount(), 1);
});
