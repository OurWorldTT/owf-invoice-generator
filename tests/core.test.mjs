import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState, formatMoney, nextDocumentNumber } from '../core.js';

test('public state starts without business-only structures', () => {
  const state = createInitialState();
  assert.deepEqual(state.documents, []);
  assert.equal('sectors' in state, false);
  assert.equal('loyalty' in state, false);
});

test('document numbers are neutral and user-friendly', () => {
  const date = new Date('2026-10-24T12:00:00Z');
  assert.equal(nextDocumentNumber('invoice', 0, date), 'INV-2026-0001');
  assert.equal(nextDocumentNumber('receipt', 8, date), 'RCT-2026-0009');
});

test('money values use the selected ISO currency', () => {
  assert.match(formatMoney(12.5, 'USD'), /12\.50/);
});
