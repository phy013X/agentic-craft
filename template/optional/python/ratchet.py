#!/usr/bin/env python3
"""棘轮（ratchet）技术债门禁：存量允许保留，新增即失败、只减不增。

零依赖，Python >=3.8，跨平台。配合 tech-debt-baseline.config.json 使用。
与同仓库 Node 版（optional/node/scripts/ratchet.mjs）行为对齐，baseline 格式互通。

用法：
    python ratchet.py                 # 对账：新增技术债 -> 退出码 1
    python ratchet.py --update        # 全量接纳现状为新基线
    python ratchet.py --prune         # 仅移除基线里已消失的条目（不接纳新增）
    python ratchet.py --config x.json --baseline y.json
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path
from typing import Dict, List, Tuple

DEFAULT_CONFIG = "tech-debt-baseline.config.json"
DEFAULT_BASELINE = "tech-debt-baseline.json"


def _matches_ext(path: str, exts) -> bool:
    return not exts or any(path.endswith(e) for e in exts)


def _excluded(path: str, exclude) -> bool:
    return any(seg in path for seg in (exclude or []))


def compute_debt(files: List[Tuple[str, str]], config: dict):
    """给定 (path, content) 列表与配置，返回 (counts, oversized)。

    counts: {"<file>::<pattern>": 次数}；oversized: 超长文件信息列表。
    """
    counts: Dict[str, int] = {}
    oversized: List[dict] = []
    patterns = config.get("patterns", [])
    line_limit = config.get("maxFileLines")

    for path, content in files:
        for pat in patterns:
            if _matches_ext(path, pat.get("extensions")) and not _excluded(path, pat.get("exclude")):
                n = len(re.findall(pat["regex"], content))
                if n > 0:
                    counts[f"{path}::{pat['name']}"] = n
        if line_limit and _matches_ext(path, line_limit.get("extensions")) and not _excluded(path, line_limit.get("exclude")):
            # 与 Node 版一致：按 \\r\\n / \\r / \\n 切分计数。
            lines = len(re.split(r"\r\n|\r|\n", content))
            if lines > line_limit["limit"]:
                oversized.append({"file": path, "lines": lines, "limit": line_limit["limit"]})
                counts[f"{path}::maxFileLines"] = lines

    return counts, oversized


def diff_baseline(current: Dict[str, int], baseline: Dict[str, int]):
    """对账当前与基线，返回 (violations, stale, scanned_empty)。"""
    violations = [
        {"key": k, "was": baseline.get(k, 0), "now": v}
        for k, v in current.items()
        if v > baseline.get(k, 0)
    ]
    stale = [k for k in baseline if k not in current]
    # 空扫描守卫：基线有数据但当前一笔没扫到，疑似配置/扫描失效，按失败处理。
    scanned_empty = bool(baseline) and not current
    return violations, stale, scanned_empty


def _list_files() -> List[str]:
    out = subprocess.run(["git", "ls-files"], check=True, capture_output=True, text=True)
    return [line for line in out.stdout.splitlines() if line.strip()]


def _read_files(paths: List[str], config: dict) -> List[Tuple[str, str]]:
    exts = set()
    for pat in config.get("patterns", []):
        exts.update(pat.get("extensions", []))
    if config.get("maxFileLines"):
        exts.update(config["maxFileLines"].get("extensions", []))

    files = []
    for path in paths:
        if exts and not any(path.endswith(e) for e in exts):
            continue
        try:
            files.append((path, Path(path).read_text(encoding="utf-8", errors="ignore")))
        except OSError:
            continue  # 不可读文件（二进制等）跳过，不应让扫描崩溃。
    return files


def _force_utf8_io() -> None:
    """Windows 控制台默认 GBK，直接 print ✓/中文会 UnicodeEncodeError；统一为 UTF-8。"""
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, ValueError):
            pass


def main(argv=None) -> int:
    _force_utf8_io()
    parser = argparse.ArgumentParser(description="Tech-debt ratchet gate")
    parser.add_argument("target", nargs="?", help="项目目录（默认当前目录）")
    parser.add_argument("--update", action="store_true", help="接纳现状为新基线")
    parser.add_argument("--prune", action="store_true", help="仅清理基线里的死账")
    parser.add_argument("--config", default=DEFAULT_CONFIG)
    parser.add_argument("--baseline", default=DEFAULT_BASELINE)
    args = parser.parse_args(argv)

    root = Path(args.target) if args.target else Path(".")
    config_path = root / args.config
    baseline_path = root / args.baseline

    if not config_path.exists():
        print(f"✗ 找不到配置 {config_path}", file=sys.stderr)
        return 2
    config = json.loads(config_path.read_text(encoding="utf-8"))

    # git ls-files 在目标目录内执行。
    import os
    prev_cwd = os.getcwd()
    os.chdir(root)
    try:
        files = _read_files(_list_files(), config)
        counts, oversized = compute_debt(files, config)

        if args.update:
            baseline = dict(sorted(counts.items()))
            baseline_path.write_text(json.dumps(baseline, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            print(f"✓ 基线已写入 {baseline_path}（{len(baseline)} 条）。请提交该文件。")
            return 0

        if not baseline_path.exists():
            print(f"✗ 找不到基线 {baseline_path}。先运行：python ratchet.py --update", file=sys.stderr)
            return 2
        baseline = json.loads(baseline_path.read_text(encoding="utf-8"))

        if args.prune:
            _, stale, _ = diff_baseline(counts, baseline)
            next_baseline = {k: v for k, v in baseline.items() if k not in stale}
            baseline_path.write_text(json.dumps(next_baseline, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            print(f"✓ 已清理 {len(stale)} 条死账（未接纳任何新增）。")
            return 0

        violations, stale, scanned_empty = diff_baseline(counts, baseline)
        if scanned_empty:
            print("✗ 扫描结果为空但基线非空：疑似配置或扫描失效，按失败处理。", file=sys.stderr)
            return 1
        if violations:
            print(f"✗ 新增技术债 {len(violations)} 处（棘轮只减不增）：", file=sys.stderr)
            for v in violations:
                file, name = v["key"].split("::", 1)
                print(f"  {file} [{name}] {v['was']} -> {v['now']}", file=sys.stderr)
            for o in oversized:
                print(f"  {o['file']} 行数 {o['lines']} 超过上限 {o['limit']}", file=sys.stderr)
            print("\n若是确有意的债，运行 --update 收下并在提交说明里解释；否则请还掉它。", file=sys.stderr)
            return 1
        tail = f" 提示：{len(stale)} 条死账可用 --prune 清理。" if stale else ""
        print(f"✓ 技术债未增加（{len(counts)} 项在账）。{tail}")
        return 0
    finally:
        os.chdir(prev_cwd)


if __name__ == "__main__":
    try:
        sys.exit(main())
    except subprocess.CalledProcessError as e:
        print(f"✗ git 命令失败：{e}", file=sys.stderr)
        sys.exit(2)
