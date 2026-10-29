#!/usr/bin/env node
// 棘轮（ratchet）技术债门禁：存量允许保留，新增即失败、只减不增。
// 零依赖，Node 18+，跨平台。配合 tech-debt-baseline.config.json 使用。
//
// 用法：
//   node scripts/ratchet.mjs            # 对账：新增技术债 -> 退出码 1
//   node scripts/ratchet.mjs --update   # 全量接纳现状为新基线（首次初始化或有意识地收下新债）
//   node scripts/ratchet.mjs --prune    # 仅移除基线里已消失的条目（清理死账，不接纳新增）
//   node scripts/ratchet.mjs --config <path> --baseline <path>
//
// 设计要点（抄自 dsh 的 verify-no-unknown-casts 棘轮模式）：
//   - 只增债失败、减债给 stale 提示但不阻塞（用 --prune 定期清理）。
//   - 空扫描守卫：候选文件为 0 但基线曾有数据时判定为扫描失败，避免误配导致全绿。
//   - 新增门禁先跑 report 观察，再接入 pre-push/CI 转 block。

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_CONFIG = 'tech-debt-baseline.config.json';
const DEFAULT_BASELINE = 'tech-debt-baseline.json';

/** 统计单个文件在某 pattern 下的债务次数。 */
function countMatches(content, regex) {
  const m = content.match(new RegExp(regex, 'g'));
  return m ? m.length : 0;
}

function matchExt(file, exts) {
  return !exts || exts.length === 0 || exts.some((e) => file.endsWith(e));
}

function excluded(file, exclude) {
  return (exclude || []).some((sub) => file.includes(sub));
}

/**
 * 纯函数：给定文件内容列表与配置，计算当前技术债。
 * files: [{ path, content }]。返回 { counts: Map<"file::pattern", number>, scannedFiles, oversized: [] }
 */
export function computeDebt(files, config) {
  const counts = new Map();
  const oversized = [];
  let scannedFiles = 0;
  const patterns = config.patterns || [];
  const lineLimit = config.maxFileLines;

  for (const f of files) {
    let counted = false;
    for (const p of patterns) {
      if (!matchExt(f.path, p.extensions) || excluded(f.path, p.exclude)) continue;
      const n = countMatches(f.content, p.regex);
      if (n > 0) counts.set(`${f.path}::${p.name}`, n);
      counted = true;
    }
    if (lineLimit && matchExt(f.path, lineLimit.extensions) && !excluded(f.path, lineLimit.exclude)) {
      const lines = f.content.split(/\r\n|\r|\n/).length;
      if (lines > lineLimit.limit) {
        oversized.push({ file: f.path, lines, limit: lineLimit.limit });
        counts.set(`${f.path}::maxFileLines`, lines);
      }
      counted = true;
    }
    if (counted) scannedFiles++;
  }
  return { counts, scannedFiles, oversized };
}

/**
 * 纯函数：对账当前与基线。
 * 返回 { violations: [{key, was, now}], stale: [key], scannedEmpty }
 */
export function diffBaseline(current, baseline) {
  const violations = [];
  const stale = [];
  for (const [key, now] of current) {
    const was = baseline[key] ?? 0;
    if (now > was) violations.push({ key, was, now });
  }
  for (const key of Object.keys(baseline)) {
    if (!current.has(key)) stale.push(key);
  }
  // 空扫描守卫：基线有数据但当前一笔都没扫到 -> 很可能是配置/扫描失效，应视为失败而非全绿。
  const scannedEmpty = Object.keys(baseline).length > 0 && current.size === 0;
  return { violations, stale, scannedEmpty };
}

function parseArgs(argv) {
  const args = { mode: 'check', config: DEFAULT_CONFIG, baseline: DEFAULT_BASELINE };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--update' || a === '--init') args.mode = 'update';
    else if (a === '--prune') args.mode = 'prune';
    else if (a === '--config') args.config = argv[++i];
    else if (a === '--baseline') args.baseline = argv[++i];
    else if (a === '--help' || a === '-h') args.mode = 'help';
  }
  return args;
}

function listFiles() {
  const out = execSync('git ls-files', { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  return out.split('\n').map((s) => s.trim()).filter(Boolean);
}

function readFiles(paths, config) {
  // 只读取可能被任一规则命中的文件，减少 IO。
  const exts = new Set();
  for (const p of config.patterns || []) (p.extensions || []).forEach((e) => exts.add(e));
  if (config.maxFileLines) (config.maxFileLines.extensions || []).forEach((e) => exts.add(e));
  const files = [];
  for (const p of paths) {
    if (exts.size > 0 && ![...exts].some((e) => p.endsWith(e))) continue;
    try {
      files.push({ path: p, content: readFileSync(p, 'utf8') });
    } catch {
      // 二进制或读取失败：跳过（技术债扫描不应因单个文件崩溃）。
    }
  }
  return files;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.mode === 'help') {
    console.log('ratchet.mjs [--update|--prune] [--config path] [--baseline path]');
    return 0;
  }
  if (!existsSync(args.config)) {
    console.error(`✗ 找不到配置 ${args.config}。请从模板复制 tech-debt-baseline.config.json 到仓库根。`);
    return 2;
  }
  const config = JSON.parse(readFileSync(args.config, 'utf8'));

  if (args.mode === 'update') {
    const files = readFiles(listFiles(), config);
    const { counts } = computeDebt(files, config);
    const baseline = Object.fromEntries([...counts.entries()].sort());
    writeFileSync(args.baseline, JSON.stringify(baseline, null, 2) + '\n');
    console.log(`✓ 基线已写入 ${args.baseline}（${Object.keys(baseline).length} 条）。请提交该文件。`);
    return 0;
  }

  if (!existsSync(args.baseline)) {
    console.error(`✗ 找不到基线 ${args.baseline}。先运行：node scripts/ratchet.mjs --update`);
    return 2;
  }
  const baseline = JSON.parse(readFileSync(args.baseline, 'utf8'));
  const files = readFiles(listFiles(), config);
  const { counts, oversized } = computeDebt(files, config);

  if (args.mode === 'prune') {
    const { stale } = diffBaseline(counts, baseline);
    const next = { ...baseline };
    for (const k of stale) delete next[k];
    writeFileSync(args.baseline, JSON.stringify(next, null, 2) + '\n');
    console.log(`✓ 已清理 ${stale.length} 条死账（未接纳任何新增）。`);
    return 0;
  }

  const { violations, stale, scannedEmpty } = diffBaseline(counts, baseline);

  if (scannedEmpty) {
    console.error('✗ 扫描结果为空但基线非空：疑似配置或扫描失效，按失败处理（防止误配全绿）。');
    return 1;
  }
  if (violations.length > 0) {
    console.error(`✗ 新增技术债 ${violations.length} 处（棘轮只减不增）：`);
    for (const v of violations) {
      const [file, name] = v.key.split('::');
      console.error(`  ${file} [${name}] ${v.was} -> ${v.now}`);
    }
    for (const o of oversized) console.error(`  ${o.file} 行数 ${o.lines} 超过上限 ${o.limit}`);
    console.error('\n若是确有意的债，运行 --update 收下并在提交说明里解释；否则请还掉它。');
    return 1;
  }
  console.log(`✓ 技术债未增加（${counts.size} 项在账）。${stale.length > 0 ? `提示：${stale.length} 条死账可用 --prune 清理。` : ''}`);
  return 0;
}

// 仅当作为 CLI 直接运行时才执行 main；被 import 做单元测试时不触发。
const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  try {
    process.exit(main());
  } catch (err) {
    console.error('✗ ratchet 执行失败：', err.message);
    process.exit(2);
  }
}
