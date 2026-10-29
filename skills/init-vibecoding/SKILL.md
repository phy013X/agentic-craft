---
name: init-vibecoding
description: 初始化一个 vibecoding 项目（agentic-craft 模板 + 可选 Superpowers：技能、自动触发钩子、需求/决策记忆层、可选硬门禁）。仅在用户用 /init-vibecoding 显式调用时执行；agent 不主动调用。
disable-model-invocation: true
---

# /init-vibecoding — 初始化 vibecoding 项目

这是 **agentic-craft 安装器 `scripts/init.mjs` 的语音入口**。本技能不自行复制文件，只负责：定位安装器 → 问清参数 → 调用安装器 → 验证汇报。所有初始化逻辑以安装器为唯一事实源。全程用中文与用户交流。

## 1. 定位 agentic-craft 仓库（安装器所在）

按顺序确定仓库绝对路径 `$CRAFT`（其下必须有 `scripts/init.mjs`）：

1. 环境变量 `AGENTIC_CRAFT_HOME`（若已设置且含 `scripts/init.mjs`）。
2. 用户在本次调用中给出的路径。
3. 都没有则**询问用户**：「agentic-craft 仓库克隆在哪个目录？」若用户尚未克隆，经同意后执行（需要网络）：
   ```sh
   git clone https://github.com/phy013X/agentic-craft.git
   ```
   再把 `$CRAFT` 指向克隆目录。

校验：`test -f "$CRAFT/scripts/init.mjs"`，否则停止并说明，不要凭空生成模板。

## 2. 确定目标项目 `$T`

- 用户给了路径就用之；否则询问要初始化的项目绝对路径。
- 安装器本身会拒绝非空目录；若 `$T` 已存在且非空，先把内容反馈给用户、请其确认，不要强行覆盖。

## 3. 问清选项（可给默认，别啰嗦）

- **是否叠加 Superpowers**（默认是；需要网络，安装时从上游拉取 pin 版本并保留其 MIT LICENSE）。不需要则加 `--no-superpowers`。
- **项目名**（可选，写入生成的 README；默认取目录名）。
- 离线/受限网络时，若本机有 Superpowers 克隆，告知可用 `--source <path>`；并可 `--no-git`。

## 4. 运行安装器

```sh
node "$CRAFT/scripts/init.mjs" "$T" [--no-superpowers] [--name <名称>] [--source <sp路径>] [--no-git]
```

安装器会：写入模板、部署技能；默认叠加 15 个 Superpowers 技能并删除 2 个重叠技能（共 21 个）、写 SessionStart 钩子与 `.claude/SUPERPOWERS_LICENSE`、`git init`。

## 5. 验证与汇报

安装器输出成功后，再核对关键产物（存在即报）：`AGENTS.md`、`CLAUDE.md`、`README.md`、`docs/spec.md`、`.claude/skills/`、以及叠加模式下的 `.claude/settings.json` + `.claude/hooks/session-start` + `.claude/SUPERPOWERS_LICENSE`。失败要如实报告，不得声称成功。

告知用户下一步：
1. 填写 `AGENTS.md` 末尾「项目约定」（语言/目录/命令/测试策略）。
2. 对 agent 说出第一个需求，由 Superpowers `brainstorming` 澄清（设计经批准才写码）。
3. 开个新会话确认 Superpowers 自动触发生效。
4. Node/TS 或 Python 项目可分别按 `optional/node/README.md`、`optional/python/README.md` 启用棘轮硬门禁。

> 维护说明：初始化行为若要改，改 `scripts/init.mjs` 与 `template/`，不要在本技能里复制复制逻辑——本文件只做调用与交互。
