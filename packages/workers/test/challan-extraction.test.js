import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { AiExtractTableProcessor } from '../dist/processors/ai-document.js';

test('AiExtractTableProcessor extracts clean challan receipt records without HTML noise', async () => {
  // Create a realistic Challan / Receipt PDF with text streams
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 800]);
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  page.drawText('TRAFFIC POLICE DEPARTMENT - E-CHALLAN RECEIPT', { x: 50, y: 750, size: 14, font, color: rgb(0, 0, 0) });
  page.drawText('Challan No: DL-2026-9812456', { x: 50, y: 710, size: 11, font, color: rgb(0, 0, 0) });
  page.drawText('Payment Date: 27/08/2026', { x: 50, y: 680, size: 11, font, color: rgb(0, 0, 0) });
  page.drawText('Vehicle Reg No: DL 01 AB 1234', { x: 50, y: 650, size: 11, font, color: rgb(0, 0, 0) });
  page.drawText('Offence: Signal Violation Red Light', { x: 50, y: 620, size: 11, font, color: rgb(0, 0, 0) });
  page.drawText('Penalty Amount: Rs. 1000.00', { x: 50, y: 590, size: 11, font, color: rgb(0, 0, 0) });
  page.drawText('Payment Status: SUCCESS', { x: 50, y: 560, size: 11, font, color: rgb(0, 0, 0) });

  const pdfBytes = await pdfDoc.save();
  const processor = new AiExtractTableProcessor();

  const ctx = {
    jobId: 'job_test_challan_1',
    attemptNumber: 1,
    allocatedMemoryBytes: 64 * 1024 * 1024,
    timeoutMs: 30000,
    onProgress: async () => {},
  };

  const result = await processor.process([Buffer.from(pdfBytes)], { format: 'csv' }, ctx);
  assert.equal(result.outputFiles.length, 1);
  assert.equal(result.outputFiles[0].filename, 'extracted_tables.csv');
  assert.equal(result.outputFiles[0].mimeType, 'text/csv');

  const csvContent = result.outputFiles[0].buffer.toString('utf8');
  console.log('\n--- Generated CSV Output ---');
  console.log(csvContent);
  console.log('----------------------------\n');

  // Verify NO HTML/DOCTYPE junk
  assert.equal(csvContent.includes('<!DOCTYPE'), false, 'Must not contain HTML DOCTYPE');
  assert.equal(csvContent.includes('<html'), false, 'Must not contain html tags');
  assert.equal(csvContent.includes('<head'), false, 'Must not contain head tags');

  // Verify Real Challan Values
  assert.ok(csvContent.includes('Challan No') || csvContent.includes('DL-2026-9812456'), 'Must extract Challan No');
  assert.ok(csvContent.includes('27/08/2026'), 'Must extract Payment Date');
  assert.ok(csvContent.includes('1000.00') || csvContent.includes('Penalty Amount'), 'Must extract Penalty Amount');
});
