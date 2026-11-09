import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

test('direct setup has backup and restore paths', async () => {
  const source = await readFile(join(import.meta.dirname, '..', 'tools', 'setup-codex-direct.mjs'), 'utf8');
  assert.match(source, /config\.toml/);
  assert.match(source, /--restore/);
  assert.match(source, /WB_BRIDGE_API_KEY/);
  assert.match(source, /wire_api = "responses"/);
  assert.match(source, /8900\/v1/);
});
