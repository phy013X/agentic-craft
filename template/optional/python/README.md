# Python 版技术债棘轮门禁

与 [Node 版](../node/README.md) 行为对齐的零依赖 Python 实现（标准库，Python ≥3.8）。

## 启用

```sh
# 1) 拷贝脚本与配置到项目根
cp optional/python/ratchet.py optional/python/tech-debt-baseline.config.json .

# 2) 按项目编辑 tech-debt-baseline.config.json（正则、扩展名、行数上限）

# 3) 生成基线并提交（把现状「收账」）
python ratchet.py --update
git add ratchet.py tech-debt-baseline.config.json tech-debt-baseline.json

# 4) 之后在推送前 / CI 跑：
python ratchet.py            # 新增技术债 -> 退出码 1
```

也可对指定目录：`python ratchet.py path/to/project [--update|--prune]`。

## 命令

- `--update`：接纳现状为新基线（首次初始化，或确有意收下新债——需在提交说明解释）。
- `--prune`：仅移除基线里已消失的死账，不接纳新增。
- `--config` / `--baseline`：自定义路径（默认读项目根的同名 JSON）。

## 自检

```sh
python -m unittest discover -s . -p 'test_*.py'
```

通用原理（为什么用棘轮、report→block、负对照）见 [Node 版 README](../node/README.md) 与根 `docs/scaling.md`。
