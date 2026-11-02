import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
test('public API declares its edition and expected database',()=>{const health=fs.readFileSync(new URL('../api/health.js',import.meta.url),'utf8');assert.match(health,/edition:'public'/);assert.match(health,/invoice_public/);assert.doesNotMatch(health,/OW Invoice System/);});
