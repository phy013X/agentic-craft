"""ratchet.py 的自测（零依赖，标准库 unittest）。

运行：python -m unittest discover -s optional/python -p 'test_*.py'
门禁本身必须被测试——一个「放行一切」的坏门禁会挂在这些负对照上。
"""

import os
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import ratchet  # noqa: E402

CONFIG = {
    "patterns": [
        {"name": "no-any", "regex": r":\s*any\b", "extensions": [".py"]},
        {"name": "no-todo", "regex": r"\bTODO\b", "extensions": [".py", ".js"]},
    ],
    "maxFileLines": {"extensions": [".py"], "limit": 5},
}


class ComputeDebtTests(unittest.TestCase):
    def test_counts_by_extension_and_regex(self):
        files = [
            ("a.py", "x: any = 1\n# TODO fix\ny: any = 2\n"),
            ("b.md", "TODO in docs should be ignored\n"),
            ("c.js", "// TODO only\n"),
        ]
        counts, _ = ratchet.compute_debt(files, CONFIG)
        self.assertEqual(counts.get("a.py::no-any"), 2)
        self.assertEqual(counts.get("a.py::no-todo"), 1)
        self.assertEqual(counts.get("c.js::no-todo"), 1)
        self.assertNotIn("b.md::no-todo", counts)

    def test_max_file_lines(self):
        files = [("big.py", "1\n2\n3\n4\n5\n6\n7\n")]
        _, oversized = ratchet.compute_debt(files, CONFIG)
        self.assertEqual(len(oversized), 1)
        self.assertEqual(oversized[0]["file"], "big.py")


class DiffBaselineTests(unittest.TestCase):
    def test_equal_passes(self):
        violations, _, scanned_empty = ratchet.diff_baseline({"a.py::no-any": 2}, {"a.py::no-any": 2})
        self.assertEqual(violations, [])
        self.assertFalse(scanned_empty)

    def test_new_debt_is_violation(self):
        violations, _, _ = ratchet.diff_baseline(
            {"a.py::no-any": 3, "b.py::no-any": 1}, {"a.py::no-any": 2}
        )
        self.assertEqual(sorted(v["key"] for v in violations), ["a.py::no-any", "b.py::no-any"])

    def test_reduced_debt_is_stale_not_violation(self):
        violations, stale, _ = ratchet.diff_baseline({}, {"a.py::no-any": 2})
        self.assertEqual(violations, [])
        self.assertEqual(stale, ["a.py::no-any"])

    def test_empty_scan_guard(self):
        _, _, scanned_empty = ratchet.diff_baseline({}, {"a.py::no-any": 1})
        self.assertTrue(scanned_empty)


class CliEndToEndTests(unittest.TestCase):
    def test_update_check_then_new_debt_fails(self):
        with tempfile.TemporaryDirectory() as d:
            import subprocess

            subprocess.run(["git", "init", "-q"], cwd=d, check=True)
            Path(d, "ratchet.py").write_text(Path(__file__).with_name("ratchet.py").read_text(encoding="utf-8"), encoding="utf-8")
            Path(d, "tech-debt-baseline.config.json").write_text(
                '{"patterns":[{"name":"no-any","regex":":\\\\s*any\\\\b","extensions":[".py"]}]}',
                encoding="utf-8",
            )
            Path(d, "a.py").write_text("x: any = 1\n", encoding="utf-8")
            subprocess.run(["git", "add", "-A"], cwd=d, check=True)

            r = subprocess.run(
                [sys.executable, "ratchet.py", "--update"],
                cwd=d, capture_output=True, text=True, encoding="utf-8",
            )
            self.assertEqual(r.returncode, 0, r.stderr)
            self.assertEqual(subprocess.run([sys.executable, "ratchet.py"], cwd=d).returncode, 0)

            Path(d, "a.py").write_text("x: any = 1\ny: any = 2\n", encoding="utf-8")
            r = subprocess.run(
                [sys.executable, "ratchet.py"],
                cwd=d, capture_output=True, text=True, encoding="utf-8",
            )
            self.assertEqual(r.returncode, 1)
            self.assertIn("新增技术债", r.stderr)


if __name__ == "__main__":
    unittest.main()
