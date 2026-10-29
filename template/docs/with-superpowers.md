# 搭配 Superpowers 使用（零冲突适配）

本适配基于 superpowers 源码精读（已克隆到本地 `D:\ClaudeCode\superpowers`）。分工原则：**Superpowers 全权负责"开发流程"，本模板只补它没有的四样——硬门禁、项目级记忆、AI 权限、技术判断清单。**

## Superpowers 的开发管线（它全权负责）

```
brainstorming            澄清需求；HARD-GATE：设计文档经你批准前不写任何产品代码
  └─ 产出设计文档 → docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md
writing-plans           把设计拆成"没看过代码的人也能照做"的计划
  └─ 产出计划 → docs/superpowers/plans/YYYY-MM-DD-<feature>.md（header 里引用 spec 路径）
subagent-driven-development / executing-plans
                        逐任务 TDD：写失败测试→看它失败→最小实现→看通过→**commit**
requesting / receiving-code-review   评审
verification-before-completion       有证据才准宣称完成
finishing-a-development-branch       收尾分支
辅助：systematic-debugging（先根因再修）、using-git-worktrees / dispatching-parallel-agents（并行）
```

## 本模板负责的四样（Superpowers 没有）

1. **硬门禁**：棘轮 + lefthook + CI。**嵌入点天然契合**——Superpowers 每个任务末尾的 `commit`、以及你的 `push`，会自动触发 pre-commit / pre-push，硬门禁在流水线每个节奏点上守底线。
2. **项目级记忆**：`docs/spec.md`（项目整体活需求）、`docs/adr/`（跨特性重大取舍）、`docs/postmortem/`。
3. **AI 透明与权限**：PR 模板的 AI Usage、AGENTS.md 的 AI git 权限边界。
4. **技术判断清单**：`error-handling` / `find-simplifications` / `speed-up-perf` / `test-reliability` / `code-review`。

## 需求文档怎么不打架（关键）

Superpowers 的 spec 是**特性级**（每个特性一份 dated 设计文档，存 `docs/superpowers/specs/`）；本模板 `docs/spec.md` 是**项目级**（整个项目当前的活需求）。两者不同粒度，分工 + 链接，**不要合并、不要互相覆盖**：

| 文档 | 粒度 | 内容 | 时态 |
|---|---|---|---|
| `docs/spec.md` | 项目级 | 整体 Problem / 非目标 / 开放问题 / 演进指针 | 现在时（活文档） |
| `docs/superpowers/specs/*-design.md` | 特性级 | 单个特性的设计（含 Approaches 取舍） | dated 存档 |
| `docs/adr/` | 决策级 | 不可逆重大取舍 + 被否方案 | 现在时 + superseded 链 |

- **保留 Superpowers 默认路径**，不要改它的行为。
- `docs/spec.md` 的「演进记录」**链接到**相关的 Superpowers spec/plan，而非复制其内容。
- 特性级设计细节以 Superpowers specs 为准；项目级当前需求以 `docs/spec.md` 为准；重大不可逆取舍记 ADR。

## 技能取舍（装 Superpowers 后）

| 本模板技能 | 处理 |
|---|---|
| `clarify-idea` | **删除**——`brainstorming` 接管需求澄清。 |
| `definition-of-done` | **删除**——`verification-before-completion` 接管；其"只报跑过的"已入 AGENTS 铁律。 |
| `code-review` | **保留为评审清单**，在 Superpowers 评审环节使用。 |
| `write-adr` / `error-handling` / `find-simplifications` / `speed-up-perf` / `test-reliability` | **保留**——Superpowers 没有。 |

最省事：
```sh
rm -rf .claude/skills/clarify-idea .claude/skills/definition-of-done
```

## 技能格式对齐

本模板技能的 frontmatter 遵循 Superpowers `writing-skills` 的约定：`description` **只写触发条件/症状、不总结工作流程**（否则 agent 会照着 description 的摘要做而不读正文）。两套技能因此有统一的 discovery 行为。

## 冲突裁决

开发流程一律以 Superpowers 为准；本模板只提供硬门禁、项目级记忆、AI 权限、技术清单。两者在一处理念完全一致：Superpowers 的 `writing-skills` 明确"**机械可强制的不要写成 skill，直接自动化（regex/validation），文档留给判断**"——这正是本模板"能机检的做成棘轮/CI 门禁"的同一条原则。
