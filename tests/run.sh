#!/bin/sh
# Kör alla tester. Kräver Node och Playwright med Chromium.
set -e
cd "$(dirname "$0")/.."
export NODE_PATH="${NODE_PATH:-$(npm root -g)}"
node tests/unit.mjs
node tests/functions.mjs
node tests/e2e.mjs
node tests/levels.mjs
