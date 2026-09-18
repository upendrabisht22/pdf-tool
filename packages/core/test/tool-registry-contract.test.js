import test from 'node:test';
import assert from 'node:assert/strict';
import { TOOL_DEFINITIONS, getClientToolContract } from '../../../apps/web/public/modules/tool-registry.js';

test('Client Registry - Tool Contract Integrity across all client definitions', () => {
  const tools = Object.keys(TOOL_DEFINITIONS);
  assert.ok(tools.length > 20, 'TOOL_DEFINITIONS must contain all tools');

  for (const toolKey of tools) {
    const contract = getClientToolContract(toolKey);
    assert.ok(contract, `Tool contract for ${toolKey} should exist`);
    assert.ok(['processor', 'generator', 'creator', 'editor'].includes(contract.mode), `Invalid mode for ${toolKey}: ${contract.mode}`);
    assert.equal(typeof contract.requiresInputFile, 'boolean', `requiresInputFile should be boolean for ${toolKey}`);
    assert.ok(['pdf', 'image', 'office', 'markdown', 'pdf-or-image', 'none'].includes(contract.inputType), `Invalid inputType for ${toolKey}: ${contract.inputType}`);

    if (contract.mode === 'generator') {
      assert.equal(contract.requiresInputFile, false, `Generator ${toolKey} must NOT require input files`);
      assert.equal(contract.inputType, 'none', `Generator ${toolKey} inputType must be none`);
      assert.equal(contract.accept, null, `Generator ${toolKey} accept must be null`);
      assert.ok(contract.studioId, `Generator ${toolKey} must have studioId`);
      assert.equal(contract.wideCanvas, true, `Generator ${toolKey} must be wideCanvas`);
    }

    if (contract.mode === 'creator') {
      assert.equal(contract.requiresInputFile, false, `Creator ${toolKey} must NOT require input files`);
      assert.ok(contract.studioId, `Creator ${toolKey} must have studioId`);
    }

    if (contract.mode === 'editor') {
      assert.equal(contract.requiresInputFile, true, `Editor ${toolKey} must require input files`);
      assert.equal(contract.inputType, 'pdf', `Editor ${toolKey} must accept PDF`);
      assert.ok(contract.studioId, `Editor ${toolKey} must have studioId`);
      assert.equal(contract.wideCanvas, true, `Editor ${toolKey} must be wideCanvas`);
    }

    if (contract.mode === 'processor') {
      assert.equal(contract.requiresInputFile, true, `Processor ${toolKey} must require input files`);
      assert.notEqual(contract.inputType, 'none', `Processor ${toolKey} must have valid inputType`);
      assert.ok(contract.accept, `Processor ${toolKey} must specify accept filter`);
    }
  }
});

test('Client Registry - Generator tools strictly enforce zero-input contract', () => {
  const generators = ['gst-invoice-pdf', 'pos-billing', 'tax-receipt', 'estimate-maker'];
  for (const key of generators) {
    const contract = getClientToolContract(key);
    assert.equal(contract.mode, 'generator', `${key} must have mode 'generator'`);
    assert.equal(contract.requiresInputFile, false, `${key} must have requiresInputFile === false`);
    assert.equal(contract.inputType, 'none', `${key} must have inputType === 'none'`);
    assert.equal(contract.accept, null, `${key} must have accept === null`);
    assert.equal(contract.wideCanvas, true, `${key} must have wideCanvas === true`);
  }
});

test('Client Registry - Fallback contract handles unknown tool safely', () => {
  const contract = getClientToolContract('unknown-tool-slug');
  assert.equal(contract.mode, 'processor');
  assert.equal(contract.requiresInputFile, true);
  assert.equal(contract.inputType, 'pdf');
  assert.equal(contract.accept, '.pdf,application/pdf');
});
