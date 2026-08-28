import test from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument } from 'pdf-lib';
import { ProtectPdfProcessor } from '../dist/processors/protect.js';
import { UnlockPdfProcessor } from '../dist/processors/unlock.js';

test('ProtectPdfProcessor and UnlockPdfProcessor - real AES-256 encryption roundtrip', async () => {
  // 1. Create a sample PDF document
  const doc = await PDFDocument.create();
  const page = doc.addPage([200, 200]);
  page.drawText('Top Secret Confidential File');
  const rawBytes = await doc.save();
  const inputBuffer = Buffer.from(rawBytes);

  const mockContext = {
    jobId: 'job_test_sec_1',
    workerId: 'worker_sec_1',
    timeoutMs: 30000,
    maxMemoryBytes: 512 * 1024 * 1024,
    tempWorkingDir: '.',
    isCancelled: () => false,
    onProgress: async () => {},
  };

  // 2. Protect with password
  const protectProcessor = new ProtectPdfProcessor();
  const protectResult = await protectProcessor.process(
    [inputBuffer],
    { userPassword: 'SecretPassword99!' },
    mockContext
  );

  assert.ok(protectResult.outputFiles[0].buffer);
  const encryptedBuffer = Buffer.from(protectResult.outputFiles[0].buffer);
  assert.ok(encryptedBuffer.length > 0);

  // 3. Confirm that trying to read with pdf-lib without password or wrong password fails
  let failedWithoutPassword = false;
  try {
    await PDFDocument.load(encryptedBuffer);
  } catch {
    failedWithoutPassword = true;
  }
  assert.strictEqual(failedWithoutPassword, true, 'Encrypted PDF must reject unauthenticated opening');

  // 4. Unlock with correct password
  const unlockProcessor = new UnlockPdfProcessor();
  const unlockResult = await unlockProcessor.process(
    [encryptedBuffer],
    { password: 'SecretPassword99!' },
    mockContext
  );

  assert.ok(unlockResult.outputFiles[0].buffer);
  const decryptedBuffer = Buffer.from(unlockResult.outputFiles[0].buffer);

  // 5. Confirm that decrypted PDF opens cleanly without any password
  const unlockedDoc = await PDFDocument.load(decryptedBuffer);
  assert.strictEqual(unlockedDoc.getPageCount(), 1);
});
