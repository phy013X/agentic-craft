# 可选层：Node 工程质量门禁

> 必装核心层（规则 + ADR + 技能 + 复盘 + PR 模板）是零依赖、全语言的。本层是给 Node/TS 项目的**可执行**门禁，按需启用。

## 启用棘轮技术债门禁（性价比最高，先做这个）

第一天就能把任何技术债维度设为「**只减不增**」，无需大重写。

```sh
# 1) 拷贝脚本与配置到仓库根/scripts
cp optional/node/scripts/ratchet.mjs        <你的项目>/scripts/
cp optional/node/tech-debt-baseline.config.json <你的项目>/

# 2) 按你的技术栈编辑 tech-debt-baseline.config.json（正则、扩展名、行数上限）

# 3) 生成基线并提交（把现状「收账」）
node scripts/ratchet.mjs --update
git add scripts/ratchet.mjs tech-debt-baseline.config.json tech-debt-baseline.json

# 4) 之后每次提交前/推送前/CI 跑：
node scripts/ratchet.mjs            # 新增技术债 -> 退出码 1
```

- **减债**会产生「死账」提示，定期 `node scripts/ratchet.mjs --prune` 清理。
- **确有意的新债**：`--update` 收下，但要在提交说明里解释为什么。
- 门禁自带测试：`node --test scripts/ratchet.test.mjs`（证明新增债一定会红、空扫描不会假绿）。

## 接入 git 钩子

```sh
cp optional/node/lefthook.yml <你的项目>/
cd <你的项目> && npx lefthook install
# 编辑 lefthook.yml，打开 pre-push 里的 tech-debt-ratchet 与你的 typecheck/lint
```

## 接入 CI（任选其一）

在现有 CI 里加一步即可（在 install 之后）：

```yaml
- name: Tech-debt ratchet
  run: node scripts/ratchet.mjs
```

## 上线姿态：report → block

新门禁先只在本地/CI 以「报告」方式跑一段时间（不阻断），确认误报可接受后，再让它「阻断」合并。这样严规则不会一上线就砸断所有人，也就没人想绕过它。

## 生成物漂移检查（如适用）

凡是「可由源码/工具重新生成」的文件（lockfile、OpenAPI/Prisma 产物、代码生成的目录/清单），在 CI 加一条「重新生成后必须无差异」：

```yaml
- run: pnpm install --frozen-lockfile        # lockfile 漂移即失败
# - run: pnpm run generate && git diff --exit-code   # 生成物与源码不一致即失败
```

## 何时升级到更重的门禁

- 包数量变多、依赖开始乱 → 考虑用脚本从源码 import 反推依赖声明/边界（dsh 的 verify-package-dependencies 思路）。
- 需要严格覆盖保障 → 覆盖率门禁设为 **per-file**（而非全局百分比），并把「未覆盖行」优先当死代码处理。
- AI/LLM 项目 → 实现 `docs/ai/record-replay.md` 的录制回放回归。
