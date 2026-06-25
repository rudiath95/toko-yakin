# Toko Yakin POS

A Point of Sale system for Toko Yakin — supports retail (eceran) and wholesale (grosir) with stackable bulk pricing.

## Features

- Product listing with barcode search
- Combined/Biasa/Grosir view toggle
- Stackable bulk pricing (multi-tier discounts)
- Shopping cart with drag-to-reorder
- Thermal receipt printing
- Online/offline mode with Google Sheets sync
- Offline support via Service Worker
- PWA-ready (can be installed on mobile browser)

## Mobile APK

An Android APK is available for download from the [GitHub Releases](https://github.com/rudiath95/toko-yakin/releases) page.

### Installation

1. Download `TokoYakin-POS.apk` from the latest release
2. Open the APK on your Android device
3. If prompted, enable **Install from unknown sources** (Settings → Security)
4. Tap **Install**

> **Note**: The APK wraps the web app in a native Android WebView. All functionality (search, cart, receipt printing, offline mode) works the same as the web version.

### Building locally

```bash
cd mobile
npm install
bash sync-app.sh                     # copy latest web files
cd android && ./gradlew assembleDebug  # build APK
```

The APK will be at `android/app/build/outputs/apk/debug/app-debug.apk`.

## Development

```bash
# Install dependencies
npm install

# Build CSS
npm run build:css

# Watch CSS
npm run dev:css
```

## Data Source

Products are loaded from `TokoYakin.xlsx` (local) or synced from Google Sheets. The spreadsheet expects two sheets: `Biasa` (retail) and `Grosir` (wholesale).
