#!/usr/bin/env bash
set -euo pipefail

URL="https://docs.google.com/spreadsheets/d/e/2PACX-1vQNgrO1HT1fanpNDiFtL9RQazcVeDJ4M1RuxJx-I9tBk_ycFqYUoDj8I6ZCnQKBIwxBRHjnhP_0_Kge/pub?output=xlsx"

curl -fSL -o TokoYakin.xlsx "$URL"
echo "Downloaded TokoYakin.xlsx"
