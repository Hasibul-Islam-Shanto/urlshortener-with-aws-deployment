#!/usr/bin/env bash
# Builds url-shortener-lambda.zip for upload to AWS Lambda.
# Handler setting: dist/lambda/handler.handler
set -euo pipefail

cd "$(dirname "$0")/.."

PACKAGE_DIR="lambda-package"
ZIP_FILE="url-shortener-lambda.zip"

rm -rf dist "$PACKAGE_DIR" "$ZIP_FILE"
npm run build

mkdir "$PACKAGE_DIR"
cp -r dist package.json package-lock.json "$PACKAGE_DIR"/

# package.json must be in the zip: it declares "type": "module" for the ESM build.
(cd "$PACKAGE_DIR" && npm ci --omit=dev --ignore-scripts --no-audit --no-fund && zip -qr "../$ZIP_FILE" .)

echo "Created $ZIP_FILE ($(du -h "$ZIP_FILE" | cut -f1))"
