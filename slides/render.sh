#!/bin/sh
# Build the deck, validate it, and render JPEG previews (preview-<stamp>-NN.jpg) for visual QA.
# The stamp changes on every run so image viewers never show a stale cache.
set -e
cd "$(dirname "$0")"
PY=.venv/bin/python
[ -x "$PY" ] || PY=python3   # the venv is optional: the system python has defusedxml and lxml
node build.js
"$PY" ../.omp/skills/pptx/scripts/office/validate.py deck.pptx
"$PY" ../.omp/skills/pptx/scripts/office/soffice.py --headless --convert-to pdf deck.pptx >/dev/null
rm -f preview-*.jpg
pdftoppm -jpeg -r 80 deck.pdf "preview-$(date +%s)"
