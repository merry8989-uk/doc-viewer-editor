#!/usr/bin/env bash
# DocForge local launcher (macOS / Linux)
cd "$(dirname "$0")" || exit 1
if command -v python3 >/dev/null 2>&1; then exec python3 start.py; fi
if command -v python  >/dev/null 2>&1; then exec python  start.py; fi
echo "Python 3 is required. Install it, then run this script again."
echo "You can also open index.html directly in your browser."
