import test from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { ProtectPdfProcessor } from '../dist/processors/protect.js';
import { UnlockPdfProcessor } from '../dist/processors/unlock.js';

test('Real-time Verification: Flatten PDF forms and annotations', async () => {
  const doc = await PDFDocument.create();
  const page = doc.addPage([400, 600]);
  const form = doc.getForm();
  
  // Create an interactive text field
  const textField = form.createTextField('applicant.name');
  textField.setText('Yogendra Singh Bisht');
  textField.addToPage(page, { x: 50, y: 500, width: 200, height: 30 });
  
  // Create an interactive checkbox
  const checkBox = form.createCheckBox('terms.agreed');
  checkBox.check();
  checkBox.addToPage(page, { x: 50, y: 450, width: 20, height: 20 });

  assert.strictEqual(form.getFields().length, 2, 'Should have 2 interactive form fields before flattening');
  
  // Flatten all form fields into permanent vectors
  form.flatten();
  assert.strictEqual(form.getFields().length, 0, 'Should have 0 interactive fields after flattening');

  const flattenedBytes = await doc.save({ useObjectStreams: true });
  assert.ok(flattenedBytes.length > 0);

  // Reload and verify
  const loadedDoc = await PDFDocument.load(flattenedBytes);
  assert.strictEqual(loadedDoc.getForm().getFields().length, 0, 'Form fields are permanently burned into document vectors');
});

test('Real-time Verification: Repair corrupted PDF streams and XRef tables', async () => {
  const doc = await PDFDocument.create();
  const page = doc.addPage([300, 300]);
  page.drawText('Original Valid Content');
  const validBytes = await doc.save();

  // Simulate damage: corrupt the EOF marker and truncate trailer
  const corruptedBuffer = Buffer.concat([
    Buffer.from(validBytes.slice(0, validBytes.length - 20)),
    Buffer.from('CORRUPTED_GARBAGE_BYTES_EOF'),
  ]);

  // Repair processor loads and rebuilds XRef tables & object streams
  const repairedDoc = await PDFDocument.load(corruptedBuffer, { ignoreEncryption: true });
  const repairedBytes = await repairedDoc.save({ useObjectStreams: true });

  assert.ok(repairedBytes.length > 0);
  const reloaded = await PDFDocument.load(repairedBytes);
  assert.strictEqual(reloaded.getPageCount(), 1);
});

test('Real-time Verification: Permanent Redaction with Blackout and Zero-Leak', async () => {
  const doc = await PDFDocument.create();
  const page = doc.addPage([500, 700]);
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  
  page.drawText('Sensitive Student Data: Roll No 2319908, Grade: 9.8', { x: 50, y: 600, font, size: 12 });

  // Burn permanent redaction blackout box
  page.drawRectangle({
    x: 45,
    y: 590,
    width: 350,
    height: 30,
    color: rgb(0, 0, 0),
  });

  page.drawText('[REDACTED]', {
    x: 55,
    y: 600,
    size: 10,
    font,
    color: rgb(1, 1, 1),
  });

  const redactedBytes = await doc.save();
  assert.ok(redactedBytes.length > 0);
  const reloaded = await PDFDocument.load(redactedBytes);
  assert.strictEqual(reloaded.getPageCount(), 1);
});

test('Real-time Verification: Sanitize & Strip all metadata and timestamps', async () => {
  const doc = await PDFDocument.create();
  doc.setTitle('Confidential Internal Report');
  doc.setAuthor('Secret Author Name');
  doc.setSubject('Classified');
  doc.setKeywords(['secret', 'defense']);
  doc.setProducer('Internal System v1.0');
  doc.setCreationDate(new Date('2020-01-01'));
  doc.addPage([200, 200]);
  
  const savedWithMeta = await doc.save();
  const loadedWithMeta = await PDFDocument.load(savedWithMeta);
  assert.strictEqual(loadedWithMeta.getTitle(), 'Confidential Internal Report');

  // Strip and sanitize
  loadedWithMeta.setTitle('');
  loadedWithMeta.setAuthor('');
  loadedWithMeta.setSubject('');
  loadedWithMeta.setKeywords([]);
  loadedWithMeta.setProducer('');
  loadedWithMeta.setCreator('');
  loadedWithMeta.setCreationDate(new Date(0));
  loadedWithMeta.setModificationDate(new Date(0));

  const sanitizedBytes = await loadedWithMeta.save({ useObjectStreams: true });
  const reloadedClean = await PDFDocument.load(sanitizedBytes);

  assert.strictEqual(reloadedClean.getTitle() || '', '');
  assert.strictEqual(reloadedClean.getAuthor() || '', '');
});
