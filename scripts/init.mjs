#!/usr/bin/env node
// agentic-craft 初始化器（零依赖，Node >=18，跨平台）。
// 把原创模板装进目标项目；可选在安装时从上游拉取 Superpowers（pin 版本、保留其 MIT LICENSE）。
//
// 用法：
//   node scripts/init.mjs <target-dir>
//   node scripts/init.mjs <target-dir> --no-superpowers      只装原创模板
//   node scripts/init.mjs <target-dir> --ref v7.0.1           指定 Superpowers 版本
//   node scripts/init.mjs <target-dir> --source ./sp-clone    用本地 Superpowers 源（离线/测试）
//   node scripts/init.mjs <target-dir> --no-git --name Foo    不 git init，并指定项目名

import { cpSync, existsSync, mkdirSync, rmSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname, basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TEMPLATE_DIR = join(REPO_ROOT, 'template');
const SUPERPOWERS_URL = 'https://github.com/obra/superpowers.git';
const DEFAULT_REF = 'v7.0.1';
// 与 Superpowers 重叠、叠加时由其接管的两个原创技能。
const OVERLAP_SKILLS = ['clarify-idea', 'definition-of-done'];

const log = (m) => console.log(m);
const fail = (m) => { console.error(`✗ ${m}`); process.exit(1); };

function parseArgs(argv) {
  const a = { target: null, superpowers: true, ref: DEFAULT_REF, source: null, git: true, name: null, help: false };
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const x = argv[i];
    if (x === '--no-superpowers') a.superpowers = false;
    else if (x === '--ref') a.ref = argv[++i];
    else if (x === '--source') a.source = argv[++i];
    else if (x === '--no-git') a.git = false;
    else if (x === '--name') a.name = argv[++i];
    else if (x === '-h' || x === '--help') a.help = true;
    else positional.push(x);
  }
  a.target = positional[0] ? resolve(positional[0]) : null;
  return a;
}

function copyTemplateCore(target) {
  for (const f of ['AGENTS.md', 'CLAUDE.md']) {
    cpSync(join(TEMPLATE_DIR, f), join(target, f));
  }
  for (const d of ['docs', 'optional', '.github']) {
    cpSync(join(TEMPLATE_DIR, d), join(target, d), { recursive: true });
  }
}

function deployOwnSkills(target) {
  const src = join(TEMPLATE_DIR, '.agents', 'skills');
  const dst = join(target, '.claude', 'skills');
  mkdirSync(dst, { recursive: true });
  for (const s of readdirSync(src)) {
    cpSync(join(src, s), join(dst, s), { recursive: true });
  }
}

function writeProjectReadme(target, name) {
  let t = readFileSync(join(TEMPLATE_DIR, 'PROJECT_README.md'), 'utf8');
  t = t.replace(/\{\{PROJECT_NAME\}\}/g, name || basename(target));
  writeFileSync(join(target, 'README.md'), t);
}

function fetchSuperpowers(args) {
  if (args.source) {
    const dir = resolve(args.source);
    if (!existsSync(join(dir, 'skills', 'using-superpowers', 'SKILL.md'))) {
      fail(`--source 不像有效的 Superpowers 副本：${dir}`);
    }
    return { dir, cleanup: () => {} };
  }
  const tmp = join(tmpdir(), `agentic-craft-sp-${Date.now()}`);
  log(`克隆 Superpowers ${args.ref}（仅这一步需要网络）…`);
  try {
    execFileSync('git', ['clone', '--depth', '1', '--branch', args.ref, SUPERPOWERS_URL, tmp], {
      stdio: ['ignore', 'inherit', 'inherit'],
    });
  } catch {
    rmSync(tmp, { recursive: true, force: true });
    fail('克隆 Superpowers 失败：检查网络/代理，或用 --source 指向本地副本来离线安装。');
  }
  return { dir: tmp, cleanup: () => rmSync(tmp, { recursive: true, force: true }) };
}

function installSuperpowers(target, srcDir, ref) {
  const skillsDst = join(target, '.claude', 'skills');
  for (const s of readdirSync(join(srcDir, 'skills'))) {
    cpSync(join(srcDir, 'skills', s), join(skillsDst, s), { recursive: true });
  }
  const hooksDst = join(target, '.claude', 'hooks');
  mkdirSync(hooksDst, { recursive: true });
  for (const h of ['session-start', 'run-hook.cmd']) {
    const p = join(srcDir, 'hooks', h);
    if (existsSync(p)) cpSync(p, join(hooksDst, h));
  }
  // MIT 署名要求：在目标项目保留上游 LICENSE 与版本记录。
  if (existsSync(join(srcDir, 'LICENSE'))) {
    cpSync(join(srcDir, 'LICENSE'), join(target, '.claude', 'SUPERPOWERS_LICENSE'));
  }
  writeFileSync(join(target, '.claude', 'SUPERPOWERS_VERSION'), `${ref}\n`);
  // 移除被 Superpowers 接管的重叠技能。
  for (const s of OVERLAP_SKILLS) {
    rmSync(join(skillsDst, s), { recursive: true, force: true });
  }
  // SessionStart 自动触发钩子。
  const settings = {
    hooks: {
      SessionStart: [{
        matcher: 'startup|clear|compact',
        hooks: [{
          type: 'command',
          command: 'CLAUDE_PLUGIN_ROOT="${CLAUDE_PROJECT_DIR}/.claude" bash "${CLAUDE_PROJECT_DIR}/.claude/hooks/session-start"',
          shell: 'bash',
          async: false,
        }],
      }],
    },
  };
  writeFileSync(join(target, '.claude', 'settings.json'), `${JSON.stringify(settings, null, 2)}\n`);
  // 修正被接管技能的悬空引用。
  const ap = join(target, 'AGENTS.md');
  const ag = readFileSync(ap, 'utf8').replace('（见技能 `definition-of-done`）', '（Superpowers `verification-before-completion`）');
  writeFileSync(ap, ag);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.target) {
    log('用法: node scripts/init.mjs <target-dir> [--no-superpowers] [--ref <tag>] [--source <path>] [--no-git] [--name <name>]');
    process.exit(args.help ? 0 : 1);
  }
  if (!existsSync(TEMPLATE_DIR)) fail(`找不到模板目录：${TEMPLATE_DIR}`);

  if (existsSync(args.target) && readdirSync(args.target).length > 0) {
    fail(`目标已存在且非空，拒绝覆盖：${args.target}`);
  }
  mkdirSync(args.target, { recursive: true });

  log('→ 写入原创模板（铁律 / 记忆层 / 可选硬门禁）…');
  copyTemplateCore(args.target);
  deployOwnSkills(args.target);
  writeProjectReadme(args.target, args.name);

  if (args.superpowers) {
    const sp = fetchSuperpowers(args);
    try {
      log('→ 叠加 Superpowers（开发流程）并保留其 LICENSE…');
      installSuperpowers(args.target, sp.dir, args.ref);
    } finally {
      sp.cleanup();
    }
  }

  if (args.git) {
    try { execFileSync('git', ['init'], { cwd: args.target, stdio: 'ignore' }); } catch { /* git 不可用时忽略 */ }
  }

  const skillCount = existsSync(join(args.target, '.claude', 'skills'))
    ? readdirSync(join(args.target, '.claude', 'skills')).length : 0;
  log('');
  log(`✓ 初始化完成：${args.target}（${skillCount} 个技能${args.superpowers ? ' = 15 Superpowers + 6 模板' : '（仅模板）'}）`);
  log('下一步：');
  log('  1) 填写 AGENTS.md 末尾「项目约定」');
  log('  2) 对 agent 说出第一个需求，由 brainstorming 澄清（设计经你批准才写码）');
  if (args.superpowers) log('  3) 开个新会话确认 Superpowers 自动触发生效');
  log('  Node/TS 项目可启用棘轮硬门禁：见 optional/node/README.md');
}

main();
