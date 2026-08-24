import test from 'node:test';
import assert from 'node:assert/strict';
import * as path from 'node:path';
import * as os from 'node:os';
import * as fs from 'node:fs/promises';
import {
  LocalStorageProvider,
  InMemoryQueueProvider,
  DefaultAuthProvider,
} from '../dist/index.js';

test('Providers - LocalStorageProvider basic put, get, head, delete lifecycle', async () => {
  const tempDir = path.join(os.tmpdir(), `test_store_${Date.now()}`);
  const store = new LocalStorageProvider(tempDir, '/test/storage');

  const testKey = 'documents/sample.pdf';
  const testData = Buffer.from('%PDF-1.7 Test PDF Data');

  // Put object
  const putRes = await store.putObject(testKey, testData, { contentType: 'application/pdf' });
  assert.equal(putRes.key, testKey);
  assert.equal(putRes.sizeBytes, testData.length);

  // Head object
  const headRes = await store.headObject(testKey);
  assert.ok(headRes);
  assert.equal(headRes.sizeBytes, testData.length);

  // Get object
  const getRes = await store.getObject(testKey);
  assert.deepEqual(getRes, testData);

  // Presigned URLs
  const uploadUrlRes = await store.createPresignedUploadUrl(testKey, {
    contentType: 'application/pdf',
    maxSizeBytes: 1024 * 1024,
  });
  assert.ok(uploadUrlRes.url.includes(encodeURIComponent(testKey)));

  const downloadUrlRes = await store.createPresignedDownloadUrl(testKey);
  assert.ok(downloadUrlRes.url.includes(encodeURIComponent(testKey)));

  // Delete object
  await store.deleteObject(testKey);
  const headAfterDelete = await store.headObject(testKey);
  assert.equal(headAfterDelete, null);

  // Cleanup temp dir
  await fs.rm(tempDir, { recursive: true, force: true });
});

test('Providers - InMemoryQueueProvider job lifecycle and state machine', async () => {
  const queue = new InMemoryQueueProvider();

  const testJob = {
    id: 'job_test_001',
    idempotencyKey: 'idem_123',
    sessionId: 'sess_1',
    operation: 'merge-pdf',
    inputFiles: [],
    options: {},
    status: 'CREATED',
    progressPercent: 0,
    attemptCount: 0,
    maxRetries: 3,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 3600000),
  };

  // Enqueue
  const enqueueRes = await queue.enqueueJob(testJob);
  assert.equal(enqueueRes.jobId, 'job_test_001');
  assert.equal(enqueueRes.status, 'QUEUED');

  // Idempotency check: re-enqueueing same key returns existing job
  const dupRes = await queue.enqueueJob({ ...testJob, id: 'job_test_002' });
  assert.equal(dupRes.jobId, 'job_test_001');

  // Lease job
  const lease = await queue.leaseJob('worker_1', 30000);
  assert.ok(lease);
  assert.equal(lease.job.id, 'job_test_001');
  assert.equal(lease.job.status, 'PROCESSING');
  assert.equal(lease.job.attemptCount, 1);

  // Progress update
  await queue.updateJobProgress('job_test_001', lease.leaseToken, 50);
  const inProgJob = await queue.getJob('job_test_001');
  assert.equal(inProgJob.progressPercent, 50);

  // ACK Job
  await queue.ackJob('job_test_001', lease.leaseToken, ['out_file_123']);
  const finishedJob = await queue.getJob('job_test_001');
  assert.equal(finishedJob.status, 'COMPLETED');
  assert.equal(finishedJob.progressPercent, 100);
  assert.deepEqual(finishedJob.outputFileIds, ['out_file_123']);
});

test('Providers - DefaultAuthProvider resolves anonymous and pro sessions', async () => {
  const auth = new DefaultAuthProvider();

  // Anonymous request
  const anonSession = await auth.resolveSession({});
  assert.equal(anonSession.tier, 'ANONYMOUS');
  assert.equal(anonSession.userId, null);
  assert.ok(anonSession.sessionId.startsWith('anon_'));

  // Authenticated Bearer request
  const proSession = await auth.resolveSession({
    authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test',
  });
  assert.equal(proSession.tier, 'PRO');
  assert.equal(proSession.userId, 'usr_pro_demo');
});
