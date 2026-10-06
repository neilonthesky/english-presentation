#!/bin/sh
# Build the deck, validate it, and render PNG previews (preview-<stamp>-NN.png) for visual QA.
# The stamp changes on every run so image viewers never show a stale cache.
set -e
cd "$(dirname "$0")"
node build.js
.venv/bin/python ../.omp/skills/pptx/scripts/office/validate.py deck.pptx
.venv/bin/python ../.omp/skills/pptx/scripts/office/soffice.py --headless --convert-to pdf deck.pptx >/dev/null
rm -f preview-*.jpg
pdftoppm -jpeg -r 80 deck.pdf "preview-$(date +%s)"
