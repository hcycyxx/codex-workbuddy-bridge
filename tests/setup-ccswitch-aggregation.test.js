import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

test('aggregation setup is guarded and has restore', async () => {
  const source = await readFile(join(import.meta.dirname, '..', 'tools', 'setup-ccswitch-aggregation.mjs'), 'utf8');
  assert.match(source, /stack\?\.enabled === true/);
  assert.match(source, /仅支持 CC Switch 聚合模式/);
  assert.match(source, /直连和路由模式未测试/);
  assert.match(source, /--restore/);
  assert.match(source, /写后回读失败/);
  assert.match(source, /8900\/v1/);
});
