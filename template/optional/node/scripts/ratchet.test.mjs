// 棘轮脚本的自测（零依赖，Node 18+ 内置 node:test）。
// 运行：node --test optional/node/scripts/ratchet.test.mjs
// 意义：门禁本身必须被测试——一个「放行一切」的坏门禁会挂在这里的负对照上。

import test from 'node:test';
import assert from 'node:assert/strict';
import { computeDebt, diffBaseline } from './ratchet.mjs';

const config = {
  patterns: [
    { name: 'no-any', regex: ':\\s*any\\b', extensions: ['.ts'] },
    { name: 'no-todo', regex: '\\bTODO\\b', extensions: ['.ts', '.js'] },
  ],
  maxFileLines: { extensions: ['.ts'], limit: 5 },
};

test('computeDebt 按扩展名与正则计数', () => {
  const files = [
    { path: 'a.ts', content: 'let x: any;\n// TODO fix\nlet y: any;\n' },
    { path: 'b.md', content: 'TODO in docs should be ignored\n' },
    { path: 'c.js', content: '// TODO only\n' },
  ];
  const { counts } = computeDebt(files, config);
  assert.equal(counts.get('a.ts::no-any'), 2);
  assert.equal(counts.get('a.ts::no-todo'), 1);
  assert.equal(counts.get('c.js::no-todo'), 1);
  assert.equal(counts.has('b.md::no-todo'), false); // md 不在扩展名内
});

test('maxFileLines 统计超长文件', () => {
  const files = [{ path: 'big.ts', content: '1\n2\n3\n4\n5\n6\n7\n' }];
  const { oversized } = computeDebt(files, config);
  assert.equal(oversized.length, 1);
  assert.equal(oversized[0].file, 'big.ts');
});

test('diffBaseline：持平通过', () => {
  const cur = new Map([['a.ts::no-any', 2]]);
  const { violations, scannedEmpty } = diffBaseline(cur, { 'a.ts::no-any': 2 });
  assert.equal(violations.length, 0);
  assert.equal(scannedEmpty, false);
});

test('diffBaseline：新增即违规（负对照：必须会红）', () => {
  const cur = new Map([['a.ts::no-any', 3], ['b.ts::no-any', 1]]);
  const { violations } = diffBaseline(cur, { 'a.ts::no-any': 2 });
  const keys = violations.map((v) => v.key).sort();
  assert.deepEqual(keys, ['a.ts::no-any', 'b.ts::no-any']); // 增加 + 全新文件都算新增
});

test('diffBaseline：减债记为 stale 而非违规', () => {
  const cur = new Map();
  const { violations, stale } = diffBaseline(cur, { 'a.ts::no-any': 2 });
  assert.equal(violations.length, 0);
  assert.deepEqual(stale, ['a.ts::no-any']);
});

test('空扫描守卫：基线非空但当前全空 -> scannedEmpty 为真', () => {
  const cur = new Map();
  const { scannedEmpty } = diffBaseline(cur, { 'a.ts::no-any': 1 });
  assert.equal(scannedEmpty, true);
});
