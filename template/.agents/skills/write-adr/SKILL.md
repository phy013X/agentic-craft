---
name: write-adr
description: 做出或推翻一个有持久影响的架构/格式/兼容性决策，需要记录其理由与被否决方案时使用。
---

# 写决策记录（ADR）

## 何时写

- **写**：架构结构、数据/持久化格式、对外兼容契约、不可逆的依赖或范式选择、推翻旧决策——即「未来的人需要知道为什么这么定、以及放弃了什么」的决策。
- **不写**：机械性/局部改动、局部 UI 调整、一次性实现细节。

## 怎么写

1. 复制 `docs/adr/0000-template.md` 为 `docs/adr/NNNN-short-slug.md`（NNNN 递增）。
2. 必填五段：`Status` / `Problem` / `Decision` / `Alternatives considered` / `Consequences`。
3. **Alternatives considered 是核心**：写清击败了哪些方案、为何放弃、代价是什么。「不记录否掉的方案，就是邀请后人重新争论一遍。」
4. 用现在时描述**当前事实**；已落地的决策不写「计划/应该/验收清单」。

## 演进规则

- 代码现实变化（路径/默认值/包名）时同 PR 更新对应 ADR 的事实描述。
- **决策本身被推翻时，不回改成相反结论**：新开一篇 ADR，两篇互相链接，旧的标记 `Status: superseded by NNNN`。
