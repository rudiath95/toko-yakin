#!/bin/bash
# Copy latest web app files to Capacitor www directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "Syncing web files to www/..."
cp "$PROJECT_DIR/index.html" "$SCRIPT_DIR/www/"
cp "$PROJECT_DIR/favicon.ico" "$SCRIPT_DIR/www/"
cp "$PROJECT_DIR/manifest.json" "$SCRIPT_DIR/www/"
cp "$PROJECT_DIR/sw.js" "$SCRIPT_DIR/www/"
cp "$PROJECT_DIR/xlsx.full.min.js" "$SCRIPT_DIR/www/"
cp "$PROJECT_DIR/TokoYakin.xlsx" "$SCRIPT_DIR/www/"
mkdir -p "$SCRIPT_DIR/www/dist"
cp "$PROJECT_DIR/dist/output.css" "$SCRIPT_DIR/www/dist/"
echo "Done! Web files synced."

