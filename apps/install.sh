#!/bin/bash
set -e
cd ../..
rm -rf node_modules/.package-lock.json 2>/dev/null || true
rm -rf .npm 2>/dev/null || true
npm install --no-optional 2>&1 || npm install --no-optional 2>&1 || npm install --no-optional
