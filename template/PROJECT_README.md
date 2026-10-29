# {{PROJECT_NAME}}

<一句话描述这个项目。>

## 开发方式（agentic coding）

本项目用 **Superpowers**（开发流程）+ **agentic-craft 模板**（硬门禁 + 记忆 + 技术清单）协作开发，两者按层分工、不冲突。

- **开发流程**：Superpowers 驱动——brainstorming 澄清需求 → writing-plans → 逐任务 TDD → 评审 → 验证 → 收尾。技能在 `.claude/skills/`，会话开始自动注入 `using-superpowers`（由 `.claude/settings.json` 的 SessionStart 钩子触发）。
- **需求与决策**：项目级活需求在 `docs/spec.md`；特性级设计在 `docs/superpowers/specs/`；重大取舍在 `docs/adr/`；事故复盘在 `docs/postmortem/`。
- **跨会话记忆**：新 agent 不继承对话，按 `AGENTS.md` 的「会话接续」协议从这些磁盘事实源重建状态。
- **工程铁律**：见 `AGENTS.md`（CLAUDE.md 仅 `@AGENTS.md`），含反合理化红旗清单、AI git 权限边界、AI 自主门禁边界。
- **硬门禁**：可选 Node 层在 `optional/`（棘轮技术债 + git hooks），启用见 `optional/node/README.md`。
- **分工说明**：`docs/with-superpowers.md`。

## 初始化后要做

1. 填 `AGENTS.md` 末尾「项目约定」（语言 / 目录 / 命令 / 测试策略）。
2. 对 agent 说出第一个需求，由 Superpowers `brainstorming` 澄清（设计经你批准才写码）。
3. Node/TS 项目启用棘轮硬门禁：见 `optional/node/README.md`。

## 第三方归属

若安装时启用了 Superpowers，其许可证见 `.claude/SUPERPOWERS_LICENSE`，版本见 `.claude/SUPERPOWERS_VERSION`。
