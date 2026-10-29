<!--
个人项目也建议在每次较大改动收尾时按此模板自检，可仅存于提交信息或任务记录。
原则：只写被测试覆盖的行为；只列实际跑过的命令。
-->

## Motivation

<为什么做这个改动，解决什么问题。>

## Changes

### Interface changes（命令 / 参数 / 配置 / 环境变量 / 导出 / 协议 / 数据格式）

<无则写 None。>

### Behavior changes

<只写 diff 确实保证、且有测试覆盖的行为变化。>

## Testing

<先写测试设计（场景 × 改前 × 改后 × 对应测试），再列实际执行的命令。>

- 跑过的命令：
  - `...`
- 证据：
  <details><summary>Proof</summary>

  <粘贴关键输出 / 截图 / 前后数值>

  </details>

## AI Usage

<按 docs/ai-usage.md 对五个阶段各标一级，并注明「谁做了关键决策」。>

| 阶段 | 级别 |
|---|---|
| 拆解 breakdown | hint / assist / pair / copilot / auto |
| 设计 design | |
| 测试 testing | |
| 实现 implementation | |
| 评审 review | |

关键决策由谁拍板：<…>
