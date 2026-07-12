#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

URL="https://docs.google.com/spreadsheets/d/e/2PACX-1vQNgrO1HT1fanpNDiFtL9RQazcVeDJ4M1RuxJx-I9tBk_ycFqYUoDj8I6ZCnQKBIwxBRHjnhP_0_Kge/pub?output=xlsx"

curl -fSL -o TokoYakin.xlsx "$URL"
echo "Downloaded TokoYakin.xlsx"

git add TokoYakin.xlsx
if ! git diff --cached --quiet; then
  git commit -m "update spreadsheet data"
  git push
else
  echo "No changes to TokoYakin.xlsx, skipping commit & push"
fi
