# agentic-craft

> 为 agentic / vibe coding 提供**硬门禁 + 持久记忆 + 人机责任边界**。可独立使用，也可叠加在 [Superpowers](https://github.com/obra/superpowers) 之上。

[English](README.md) | 中文　[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

AI 写码很快，但有三个会让代码库变乱的特性：上下文清空就**失忆**、会**找借口**绕过流程（"就这一次"）、不为上线后果**担责**。

Superpowers 给了 agent 一套极好的开发**流程**（澄清需求 → 计划 → TDD → 评审 → 验证），但它刻意是**纯软约束**（靠 prompt）且只活在单会话内。**agentic-craft 补它没有的三层**：

- **硬门禁**：一个零依赖、带自测的**技术债棘轮**（存量允许、新增即失败）+ git hook/CI 接入点——agent 绕不过。
- **持久记忆**：活的项目 `spec`、ADR（含被否方案）、复盘——新 agent 从磁盘重建状态，而非继承聊天。
- **责任边界**：明确的 AI git 权限边界 + PR 模板里的 **AI 参与度披露**（hint…auto + 谁拍板）。
- **技术判断 skill**：代码评审、错误处理、简化、性能、测试可靠性。

一句话：**软约束负责"劝"，硬门禁负责"管"，持久记忆负责"不忘"。**

## 快速开始

```sh
git clone https://github.com/<your-org>/agentic-craft.git
cd agentic-craft
node scripts/init.mjs ../my-app                 # 模板 + pin 在 v7.0.1 的 Superpowers
node scripts/init.mjs ../my-app --no-superpowers  # 仅模板、无需联网
node scripts/init.mjs ../my-app --source ./superpowers  # 用本地 Superpowers 源（离线/CI）
```

选项：`--no-superpowers` / `--ref <tag>` / `--source <path>` / `--no-git` / `--name <name>`。
初始化器拒绝写入**非空目录**，在生成项目中保留 Superpowers 的 MIT LICENSE，并在叠加时移除两个重叠技能（`clarify-idea`、`definition-of-done`）以保证零冲突。

## 分工

- **Superpowers 管流程**：何时澄清、计划、TDD、调试、评审、验证；特性设计在 `docs/superpowers/specs/`。
- **agentic-craft 管其余**：项目级需求、持久决策、硬门禁、AI 权限、技术清单。流程冲突时以 Superpowers 为准。

## 棘轮门禁

把当前技术债（`any`、`@ts-ignore`、`eslint-disable`、`TODO`、超长文件）快照入库，**新增即失败、基线只减不增**；自带负对照测试与空扫描守卫。

```sh
node optional/node/scripts/ratchet.mjs --update  # 快照现状
node optional/node/scripts/ratchet.mjs          # CI/推送前：新增即 exit 1
```

更多说明见英文 [README](README.md) 与 [NOTICE.md](NOTICE.md)。方法论学自 deepseek-harness，并与 Jesse Vincent 的 Superpowers 互补；不 vendor 任何第三方代码，Superpowers 在安装时按其 MIT 许可证按需拉取。

## 许可证

[MIT](LICENSE)。
