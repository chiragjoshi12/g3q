#!/usr/bin/env python3
"""Run the beta translator with several Gemini requests at once.

This is a thin wrapper around translate-beta-questions.py (defaults to 8 workers).
"""

from __future__ import annotations

import runpy
import sys
from pathlib import Path

SCRIPT = Path(__file__).resolve().parent / "translate-beta-questions.py"


def main() -> None:
    args = sys.argv[1:]
    if "--workers" not in args:
        args = ["--workers", "8", *args]
    sys.argv = [str(SCRIPT), *args]
    runpy.run_path(str(SCRIPT), run_name="__main__")


if __name__ == "__main__":
    main()
