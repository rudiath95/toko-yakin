// Reactive shared store: all POS state + actions (Vue 3 single-file app, no build step).
(function () {
  "use strict";

  var V = Vue.version ? Vue : window.Vue;

  var GOOGLE_SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQNgrO1HT1fanpNDiFtL9RQazcVeDJ4M1RuxJx-I9tBk_ycFqYUoDj8I6ZCnQKBIwxBRHjnhP_0_Kge/pub?output=xlsx";
  var ONLINE_TIMEOUT = 10000;
  var PAGE_SIZE = 100;
  var AUTOSAVE_INTERVAL = 10000;
  var AUTOSAVE_MAX_SLOTS = 100;

  var S = {
    // ---- data ----
    cart: [],
    customer: "",
    uangPembeli: "",
    products: {},              // current view: barcode -> product
    allProducts: {},           // sheetName -> { barcode -> product }
    viewMode: "combined",      // "combined" | "biasa" | "grosir"
    searchTerm: "",
    showBulkColumns: false,
    layoutMode: "list",        // "list" | "thumbnail"
    cartOpen: false,
    offlineMode: false,
    useGoogleSource: true,
    isLoading: false,
    cachedSheetData: null,
    imageObjectUrls: {},
    loadedCount: 0,
    qtyInputs: {},
    savedCartsTab: "saved",    // "saved" | "autosaved"
    savedCarts: [],
    autosavedCarts: [],
    savedCartsOpen: false,
    customModalOpen: false,
    customName: "",
    customSubtotal: "",
    shortcutsModalOpen: false,
    qtyPopup: { show: false, x: 0, y: 0, list: [], anchor: null, barcode: null, popupEl: null },
    toast: "",
    isMobile: typeof window !== "undefined" ? window.innerWidth < 768 : false,
    imgFailed: {},
    // ---- autosave bookkeeping ----
    lastAutosaveId: null,
    lastAutosaveFingerprint: "",

    // ================= ESCAPE / FORMAT =================
    snapshot: function (items) {
      return JSON.parse(JSON.stringify(items || []));
    },

    escapeHtml: function (str) {
      if (!str) return "";
      return String(str).replace(/[&<>]/g, function (m) {
        if (m === "&") return "&amp;";
        if (m === "<") return "&lt;";
        if (m === ">") return "&gt;";
        return m;
      });
    },

    formatTimestamp: function (ts) {
      var d = new Date(ts);
      var dateStr = d.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" });
      var timeStr = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
      return dateStr + " " + timeStr;
    },

    // ================= TOAST =================
    showToast: function (message) {
      S.toast = message;
      clearTimeout(S._toastTimer);
      S._toastTimer = setTimeout(function () { S.toast = ""; }, 1800);
    },

    // ================= PRODUCTS =================
    async loadSheetData(sheetName) {
      if (S.isLoading) return;
      S.isLoading = true;
      try {
        var arrayBuffer;
        if (S.useGoogleSource) {
          if (S.cachedSheetData) {
            arrayBuffer = S.cachedSheetData;
          } else {
            var response = await S.fetchWithTimeout(GOOGLE_SHEET_URL, ONLINE_TIMEOUT);
            if (!response.ok) throw new Error("HTTP " + response.status);
            arrayBuffer = await response.arrayBuffer();
            S.cachedSheetData = arrayBuffer;
          }
        } else {
          var localRes = await fetch("TokoYakin.xlsx");
          if (!localRes.ok) throw new Error("Local file not found");
          arrayBuffer = await localRes.arrayBuffer();
        }
        var workbook = XLSX.read(arrayBuffer, { type: "array" });
        var sheet = workbook.Sheets[sheetName];
        if (!sheet) throw new Error('Sheet "' + sheetName + '" not found');

        var rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
        if (!rows || rows.length < 2) throw new Error('No data rows in sheet "' + sheetName + '"');
        var dataRows = rows;
        var firstRow = rows[0];
        var isHeaderRow = firstRow && firstRow.some(function (cell) {
          return typeof cell === "string" &&
            (cell.toLowerCase().indexOf("barcode") !== -1 ||
             cell.toLowerCase().indexOf("name") !== -1 ||
             cell.toLowerCase().indexOf("category") !== -1);
        });
        if (isHeaderRow) dataRows = rows.slice(1);

        if (!S.allProducts[sheetName]) S.allProducts[sheetName] = {};
        var productCount = 0;
        for (var i = 0; i < dataRows.length; i++) {
          var row = dataRows[i];
          if (!row || row.length < 4) continue;
          var barcode = (row[0] || "").toString().trim();
          var name = (row[1] || "").toString().trim();
          var category = (row[2] || "").toString().trim();
          var singlePrice = parseFloat(row[3]) || 0;
          if (!barcode || singlePrice <= 0) continue;

          var min1 = parseInt(row[4], 10) || 0;
          var total1 = parseFloat(row[5]) || 0;
          var min2 = parseInt(row[6], 10) || 0;
          var total2 = parseFloat(row[7]) || 0;
          var min3 = parseInt(row[8], 10) || 0;
          var total3 = parseFloat(row[9]) || 0;

          var tiers = [];
          if (min1 > 0 && total1 > 0) tiers.push({ min: min1, totalPrice: total1 });
          if (min2 > 0 && total2 > 0) tiers.push({ min: min2, totalPrice: total2 });
          if (min3 > 0 && total3 > 0) tiers.push({ min: min3, totalPrice: total3 });

          S.allProducts[sheetName][barcode] = {
            barcode: barcode,
            name: name,
            category: category,
            singlePrice: singlePrice,
            tiers: tiers,
            type: (row[10] || "").toString().trim(),
            imageUrl: (row[12] || "").toString().trim()
          };
          productCount++;
        }
        if (productCount === 0) throw new Error('No valid products found in sheet "' + sheetName + '"');
      } catch (err) {
        console.error('Failed to load sheet "' + sheetName + '":', err);
        throw err;
      } finally {
        S.isLoading = false;
      }
    },

    insertFallbackDemo() {
      var fallback = [
        ["APPLE01", "Apple (Fresh)", "Fruits", "1.00", "5", "3.00", "10", "5.00", "100", "50.00"],
        ["COF001", "Espresso", "Coffee", "3.50", "2", "6.00", "5", "14.00", "10", "25.00"],
        ["BLK415", "Muffin", "Pastry", "2.50", "2", "4.00", "4", "7.00", "8", "12.00"]
      ];
      S.products = {};
      S.allProducts = { "Biasa": {}, "Grosir": {} };
      S.allProducts["Grosir"] = {};
      fallback.forEach(function (cols) {
        var parts = cols.map(function (c) { return String(c).trim(); });
        var singlePrice = parseFloat(parts[3]) || 0;
        var tiers = [];
        if (parseInt(parts[4], 10) > 0 && parseFloat(parts[5]) > 0) tiers.push({ min: parseInt(parts[4], 10), totalPrice: parseFloat(parts[5]) });
        if (parseInt(parts[6], 10) > 0 && parseFloat(parts[7]) > 0) tiers.push({ min: parseInt(parts[6], 10), totalPrice: parseFloat(parts[7]) });
        if (parseInt(parts[8], 10) > 0 && parseFloat(parts[9]) > 0) tiers.push({ min: parseInt(parts[8], 10), totalPrice: parseFloat(parts[9]) });
        S.allProducts["Biasa"][parts[0]] = { barcode: parts[0], name: parts[1], category: parts[2], singlePrice: singlePrice, tiers: tiers };
      });
      fallback.forEach(function (cols) {
        var parts = cols.map(function (c) { return String(c).trim(); });
        var grosirPrice = parseFloat(parts[3]) * 0.9 || 0;
        var tiers = [];
        if (parseInt(parts[4], 10) > 0 && parseFloat(parts[5]) > 0) tiers.push({ min: parseInt(parts[4], 10), totalPrice: parseFloat(parts[5]) * 0.9 });
        if (parseInt(parts[6], 10) > 0 && parseFloat(parts[7]) > 0) tiers.push({ min: parseInt(parts[6], 10), totalPrice: parseFloat(parts[7]) * 0.9 });
        if (parseInt(parts[8], 10) > 0 && parseFloat(parts[9]) > 0) tiers.push({ min: parseInt(parts[8], 10), totalPrice: parseFloat(parts[9]) * 0.9 });
        S.allProducts["Grosir"][parts[0]] = { barcode: parts[0], name: parts[1], category: parts[2], singlePrice: grosirPrice, tiers: tiers };
      });
      S.renderCombinedView();
    },

    // ================= VIEWS =================
    renderCombinedView() {
      S.viewMode = "combined";
      var biasaProducts = S.allProducts["Biasa"] || {};
      var grosirProducts = S.allProducts["Grosir"] || {};
      var allBarcodes = new Set(Object.keys(biasaProducts));
      Object.keys(grosirProducts).forEach(function (b) { allBarcodes.add(b); });

      S.products = {};
      allBarcodes.forEach(function (barcode) {
        var biasa = biasaProducts[barcode];
        var grosir = grosirProducts[barcode];
        var name = (biasa && biasa.name) || (grosir && grosir.name) || "Unknown";
        var category = (biasa && biasa.category) || (grosir && grosir.category) || "";
        var price = biasa ? biasa.singlePrice : (grosir ? grosir.singlePrice : 0);
        var primary = biasa || grosir;
        var tiers = (primary && primary.tiers) || [];
        S.products[barcode] = {
          barcode: barcode,
          name: name,
          category: category,
          singlePrice: price,
          tiers: tiers,
          type: (primary && primary.type) || "",
          imageUrl: (primary && primary.imageUrl) || ""
        };
      });
      S.qtyInputs = {};
      S.resetProductView();
    },

    renderSheetView(sheetName) {
      S.viewMode = sheetName.toLowerCase();
      S.products = S.allProducts[sheetName] || {};
      S.qtyInputs = {};
      S.resetProductView();
    },

    switchView(view) {
      if (view === "combined") S.renderCombinedView();
      else if (view === "biasa") S.renderSheetView("Biasa");
      else if (view === "grosir") S.renderSheetView("Grosir");
    },

    resetProductView() {
      S.loadedCount = 0;
      S.loadNextBatch(S.countFiltered());
    },

    countFiltered() {
      var term = (S.searchTerm || "").trim().toLowerCase();
      var keys = Object.keys(S.products);
      if (!term) return keys.length;
      var n = 0;
      for (var i = 0; i < keys.length; i++) {
        var p = S.products[keys[i]];
        if (p && (String(p.barcode).toLowerCase().indexOf(term) !== -1 || String(p.name).toLowerCase().indexOf(term) !== -1)) n++;
      }
      return n;
    },

    loadNextBatch(count) {
      if (S.layoutMode === "thumbnail") {
        S.loadedCount = Number.MAX_SAFE_INTEGER;
        return;
      }
      if (S.loadedCount < count) {
        S.loadedCount += PAGE_SIZE;
      }
    },

    // ================= TOGGLE ONLINE / SYNC =================
    fetchWithTimeout(url, ms) {
      var controller = (typeof AbortController !== "undefined") ? new AbortController() : null;
      var timer = null;
      if (controller) timer = setTimeout(function () { controller.abort(); }, ms || ONLINE_TIMEOUT);
      return fetch(url, controller ? { signal: controller.signal } : {}).then(
        function (res) { if (timer) clearTimeout(timer); return res; },
        function (err) {
          if (timer) clearTimeout(timer);
          if (controller && controller.signal.aborted) {
            var secs = (ms || ONLINE_TIMEOUT) / 1000;
            var timeoutErr = new Error("Timed out after " + secs + "s reaching the online sheet");
            timeoutErr.name = "TimeoutError";
            throw timeoutErr;
          }
          throw err;
        }
      );
    },

    goOffline: function (reason) {
      if (S.offlineMode) return;
      S.offlineMode = true;
      S.useGoogleSource = false;
      S.cachedSheetData = null;
      S.allProducts = {};
      S.showToast("📴 Auto-switched to offline mode — " + reason);
    },

    async toggleOnlineMode() {
      S.offlineMode = !S.offlineMode;
      if (S.offlineMode) {
        S.useGoogleSource = false;
        S.showToast("📴 Offline mode — using local TokoYakin.xlsx");
      } else {
        S.useGoogleSource = true;
        S.cachedSheetData = null;
        S.showToast("📶 Online mode — fetching live data");
      }
      S.allProducts = {};
      try {
        await S.loadSheetData("Biasa");
        await S.loadSheetData("Grosir");
      } catch (e) {
        console.warn("Online load failed", e);
        if (S.useGoogleSource) {
          S.goOffline("sheet unreachable or timed out");
        }
        var triedLocal = false;
        try {
          await S.loadSheetData("Biasa");
          await S.loadSheetData("Grosir");
        } catch (e2) {
          console.warn("Local load failed, using fallback demo", e2);
          S.insertFallbackDemo();
          triedLocal = true;
        }
        if (!triedLocal && Object.keys(S.allProducts["Biasa"] || {}).length === 0) {
          S.insertFallbackDemo();
        }
      }
      S.switchView(S.viewMode);
      S.prefetchImages();
    },

    async syncSheet() {
      if (S.offlineMode) {
        S.showToast("📴 Cannot sync while offline mode is active");
        return;
      }
      try {
        S.showToast("⏳ Syncing from Google Sheets...");
        var response = await S.fetchWithTimeout(GOOGLE_SHEET_URL, ONLINE_TIMEOUT);
        if (!response.ok) throw new Error("HTTP " + response.status);
        var arrayBuffer = await response.arrayBuffer();
        S.cachedSheetData = arrayBuffer;
        S.useGoogleSource = true;
        var blob = new Blob([arrayBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        var url = URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = url;
        a.download = "TokoYakin.xlsx";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        await S.loadSheetData("Biasa");
        await S.loadSheetData("Grosir");
        S.switchView(S.viewMode);
        S.prefetchImages();
        S.showToast("✅ Synced & loaded — file saved to Downloads");
      } catch (err) {
        S.showToast("❌ Sync failed: " + err.message);
      }
    },

    // ================= IMAGE CACHE =================
    async getCachedImageUrl(url) {
      if (!url) return null;
      if (S.imageObjectUrls[url]) return S.imageObjectUrls[url];
      var blob = await DB.imageGet(url);
      if (blob) {
        var objUrl = URL.createObjectURL(blob);
        S.imageObjectUrls[url] = objUrl;
        return objUrl;
      }
      return null;
    },

    async cacheImage(url) {
      if (!url || S.imageObjectUrls[url]) return;
      try {
        var resp = await fetch(url);
        if (!resp.ok) return;
        var blob = await resp.blob();
        await DB.imagePut(url, blob);
        var objUrl = URL.createObjectURL(blob);
        S.imageObjectUrls[url] = objUrl;
      } catch (e) {}
    },

    prefetchImages() {
      var urls = new Set();
      Object.keys(S.allProducts).forEach(function (sheetName) {
        Object.keys(S.allProducts[sheetName]).forEach(function (barcode) {
          var url = S.allProducts[sheetName][barcode].imageUrl;
          if (url) urls.add(url);
        });
      });
      urls.forEach(function (u) { S.cacheImage(u); });
    },

    async onImgError(barcode, event) {
      var p = S.products[barcode];
      if (!p || !p.imageUrl) { S.imgFailed[barcode] = true; return; }
      var cached = await S.getCachedImageUrl(p.imageUrl);
      if (cached && event.target && event.target.src !== cached) {
        event.target.src = cached;
        return;
      }
      S.imgFailed[barcode] = true;
    },

    // ================= CART =================
    qtyInCart(barcode) {
      var item = S.cart.find(function (i) { return i.barcode === barcode; });
      return item ? item.qty : 0;
    },

    addToCart(productData, qty) {
      qty = parseInt(qty, 10) || 1;
      var existingIndex = S.cart.findIndex(function (i) { return i.barcode === productData.barcode; });
      if (existingIndex !== -1) {
        S.cart[existingIndex].qty += qty;
      } else {
        var tiersCopy = (productData.tiers || []).map(function (t) { return Object.assign({}, t); });
        S.cart.push({
          barcode: productData.barcode,
          name: productData.name,
          singlePrice: productData.singlePrice,
          tiers: tiersCopy,
          qty: qty,
          type: productData.type || ""
        });
      }
    },

    addCustomProduct(name, subtotal) {
      var id = "CUSTOM-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6);
      S.cart.push({
        barcode: id,
        name: name,
        singlePrice: subtotal,
        tiers: [],
        qty: 1,
        type: "custom"
      });
    },

    cartInc(barcode) {
      var idx = S.cart.findIndex(function (i) { return i.barcode === barcode; });
      if (idx !== -1) S.cart[idx].qty++;
    },

    cartDec(barcode) {
      var idx = S.cart.findIndex(function (i) { return i.barcode === barcode; });
      if (idx === -1) return;
      if (S.cart[idx].qty <= 1) {
        S.cart.splice(idx, 1);
      } else {
        S.cart[idx].qty--;
      }
    },

    cartRemove(barcode) {
      var idx = S.cart.findIndex(function (i) { return i.barcode === barcode; });
      if (idx !== -1) S.cart.splice(idx, 1);
    },

    reorderCart(fromId, toId) {
      var fromIdx = S.cart.findIndex(function (i) { return i.barcode === fromId; });
      var toIdx = S.cart.findIndex(function (i) { return i.barcode === toId; });
      if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return;
      var moved = S.cart.splice(fromIdx, 1)[0];
      S.cart.splice(toIdx, 0, moved);
    },

    clearCart() {
      S.cart = [];
      S.customer = "";
      S.uangPembeli = "";
    },

    // ================= SHORTCUTS =================
    defaultShortcuts: [
      { id: "viewAll",     label: "Switch to All",       key: "Alt+1" },
      { id: "viewBiasa",   label: "Switch to Biasa",     key: "Alt+2" },
      { id: "viewGrosir",  label: "Switch to Grosir",    key: "Alt+3" },
      { id: "toggleMode",  label: "Toggle Online/Offline", key: "Alt+4" },
      { id: "syncSheet",   label: "Sync Sheet",          key: "Alt+5" },
      { id: "customProd",  label: "Add Custom Product",  key: "Alt+6" },
      { id: "saveCart",    label: "Save Cart",           key: "Alt+7" },
      { id: "loadCart",    label: "Load/Browse Carts",   key: "Alt+8" },
      { id: "clearCart",   label: "Clear Cart",          key: "Alt+9" },
      { id: "focusCustomer", label: "Focus Customer",    key: "Alt+0" },
      { id: "focusSearch",  label: "Focus Search",       key: "Alt+q" },
      { id: "closeModal",  label: "Close Modal/Panel",   key: "Escape" }
    ],
    customShortcuts: [],

    loadShortcuts() {
      try {
        var raw = localStorage.getItem("toko-shortcuts");
        if (raw) {
          var parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            S.customShortcuts = parsed;
            S.defaultShortcuts.forEach(function (d) {
              if (!S.customShortcuts.find(function (s) { return s.id === d.id; })) {
                S.customShortcuts.push({ id: d.id, label: d.label, key: d.key });
              }
            });
            return;
          }
        }
      } catch (e) { /* ignore */ }
      S.customShortcuts = S.defaultShortcuts.map(function (d) { return { id: d.id, label: d.label, key: d.key }; });
    },

    saveShortcuts() {
      localStorage.setItem("toko-shortcuts", JSON.stringify(S.customShortcuts));
    },

    resetShortcuts() {
      S.customShortcuts = S.defaultShortcuts.map(function (d) { return { id: d.id, label: d.label, key: d.key }; });
      S.saveShortcuts();
    },

    getShortcutKey(id) {
      var found = S.customShortcuts.find(function (s) { return s.id === id; });
      if (found) return found.key;
      var def = S.defaultShortcuts.find(function (s) { return s.id === id; });
      return def ? def.key : "";
    },

    // ================= SAVED CARTS =================
    saveNamedCart() {
      var name = (S.customer || "").trim();
      if (!name) { S.showToast("⚠️ Type a customer name first"); return; }
      if (S.cart.length === 0) { S.showToast("⚠️ Cart is empty"); return; }
      var now = new Date();
      var dateStr = now.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" });
      var timeStr = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
      var id = "cart_" + now.getTime();
      DB.put({
        id: id,
        customer: name,
        date: dateStr + " " + timeStr,
        items: S.snapshot(S.cart),
        updatedAt: Date.now()
      });
      S.showToast("💾 Saved cart for " + name);
    },

    async loadSavedCart(id) {
      var data = await DB.get(id);
      if (!data || !data.items) { S.showToast("⚠️ Cart not found"); return; }
      S.cart = S.snapshot(data.items);
      S.customer = data.customer || "";
      S.closeSavedCarts();
      S.showToast("📋 Loaded cart for " + (data.customer || "unknown"));
    },

    async deleteSavedCart(id) {
      if (!confirm("Delete this saved cart?")) return;
      await DB.delete(id);
      S.refreshSavedCarts();
    },

    openSavedCarts() {
      S.savedCartsOpen = true;
      S.refreshSavedCarts();
    },

    closeSavedCarts() {
      S.savedCartsOpen = false;
    },

    async refreshSavedCarts() {
      var all = await DB.getAll();
      S.savedCarts = all.filter(function (e) { return e.id && e.id.indexOf("cart_") === 0; })
        .sort(function (a, b) { return (b.updatedAt || 0) - (a.updatedAt || 0); });
      S.autosavedCarts = all.filter(function (e) { return e.id && e.id.indexOf("autosave_") === 0; })
        .sort(function (a, b) { return (b.updatedAt || 0) - (a.updatedAt || 0); });
    },

    // ================= AUTOSAVE =================
    async autosaveCart() {
      if (!S.cart || S.cart.length === 0) return;
      var now = Date.now();
      var customerName = (S.customer || "").trim();
      var items = S.snapshot(S.cart);
      var fingerprint = JSON.stringify(items.map(function (i) { return [i.type, i.barcode, i.qty, i.singlePrice]; }));

      if (S.lastAutosaveId && S.lastAutosaveFingerprint === fingerprint) {
        return;
      }

      var id = "autosave_" + now;
      await DB.put({
        id: id,
        customer: customerName,
        date: S.formatTimestamp(now),
        items: items,
        autosave: true,
        updatedAt: now
      });
      S.lastAutosaveId = id;
      S.lastAutosaveFingerprint = fingerprint;

      var all = await DB.getAll();
      var auto = all.filter(function (e) { return e.id && e.id.indexOf("autosave_") === 0; })
        .sort(function (a, b) { return (b.updatedAt || 0) - (a.updatedAt || 0); });
      var excess = auto.slice(AUTOSAVE_MAX_SLOTS);
      for (var i = 0; i < excess.length; i++) {
        await DB.delete(excess[i].id);
      }
    },

    persistCurrentCart() {
      DB.put({ id: "current-cart", customer: S.customer, items: S.snapshot(S.cart), updatedAt: Date.now() });
    },

    async loadInitialCart() {
      S.loadShortcuts();
      var data = await DB.get("current-cart");
      if (!data) {
        var saved = localStorage.getItem("toko-cart");
        if (saved) {
          try {
            var parsed = JSON.parse(saved);
            data = Array.isArray(parsed) ? { customer: "", items: parsed } : parsed;
          } catch (e) { data = null; }
        }
      }
      if (data) {
        S.cart = S.snapshot(data.items);
        S.customer = data.customer || "";
      }
    },

    // ================= EXPORT / IMPORT =================
    exportCart() {
      if (S.cart.length === 0) { S.showToast("⚠️ Cart is empty, nothing to export"); return; }
      var lines = S.cart.map(function (item) { return item.barcode + ":" + item.qty; });
      var text = lines.join("\n");
      navigator.clipboard.writeText(text).then(function () {
        S.showToast("📋 Exported " + S.cart.length + " items to clipboard");
      }).catch(function () {
        S.showToast("❌ Failed to copy to clipboard");
      });
    },

    async importCart() {
      try {
        var text = await navigator.clipboard.readText();
        var lines = text.split("\n").filter(function (l) { return l.trim(); });
        if (lines.length === 0) { S.showToast("⚠️ Clipboard is empty"); return; }
        var added = 0, errors = 0, skipped = 0;
        for (var i = 0; i < lines.length; i++) {
          var parts = lines[i].trim().split(/[:|]/);
          if (parts.length < 2) { errors++; continue; }
          var barcode = parts[0].trim();
          var qty = parseInt(parts[1].trim(), 10);
          if (!barcode || isNaN(qty) || qty < 1) { errors++; continue; }
          var prod = S.products[barcode];
          if (!prod) {
            var found = null;
            Object.keys(S.allProducts).forEach(function (sheetName) {
              if (S.allProducts[sheetName][barcode]) found = S.allProducts[sheetName][barcode];
            });
            prod = found;
          }
          if (!prod) { skipped++; continue; }
          S.addToCart(prod, qty);
          added++;
        }
        if (added > 0) {
          S.showToast("📥 Imported " + added + " item(s)" + (skipped > 0 ? " (" + skipped + " not found)" : "") + (errors > 0 ? " (" + errors + " invalid)" : ""));
        } else {
          S.showToast("⚠️ No valid items found in clipboard");
        }
      } catch (e) {
        S.showToast("❌ Failed to read clipboard");
      }
    },

    // ================= RECEIPT =================
    showThermalReceipt() {
      if (S.cart.length === 0) {
        alert("🛒 Cart is empty. Nothing to print.");
        return;
      }
      var receiptItems = [];
      var grandTotal = 0;
      var uangPembeli = parseFloat(S.uangPembeli) || 0;
      S.cart.forEach(function (item) {
        var res = Pricing.compute(item.singlePrice, item.tiers, item.qty);
        grandTotal += res.total;
        receiptItems.push({
          name: item.name,
          qty: item.qty,
          subtotal: res.total,
          type: item.type || "",
          singlePrice: item.singlePrice
        });
      });

      var now = new Date();
      var dateStr = now.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" });
      var timeStr = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

      var esc = S.escapeHtml;
      var printHtml = [
        "<!DOCTYPE html><html><head><meta charset='UTF-8'><title>Print Receipt</title><style>",
        "@media print{@page{margin:0 6px 0 0}body{padding:2cm}}*{margin:0;padding:0;box-sizing:border-box}",
        "body{font-family:'Courier New','Lucida Console','SF Mono','Courier',monospace;font-size:12px;width:58mm;margin:0 auto;padding:2mm 1.5mm;background:white;color:black}",
        ".store-name{text-align:center;font-size:18px;font-weight:bold;letter-spacing:1px;margin-bottom:3px;border-bottom:1px dashed #222;padding-bottom:3px}",
        ".store-tag{text-align:center;font-size:10px;margin-bottom:6px;color:#333}",
        ".divider{border-top:1px dashed #222;margin:5px 0}",
        ".print-date{text-align:center;margin-bottom:5px}",
        ".receipt{font-size:12px;font-weight:bold}",
        ".receipt-header{display:flex;justify-content:space-between;border-bottom:1px dotted #222;padding:4px 0 2px;margin-bottom:4px}",
        ".receipt-item{display:flex;justify-content:space-between;align-items:baseline;line-height:1.25}",
        ".item-name{flex:2;word-break:break-word;padding-right:4px}",
        ".item-sub{flex:1;text-align:right;white-space:nowrap;font-weight:bold;padding-right:8px}",
        ".receipt-sub-row{margin-bottom:6px}",
        ".total-row{margin-top:6px;border-top:1px dashed #222;font-weight:bold;font-size:18px;display:flex;justify-content:space-between;padding:5px 2px 2px}",
        ".footer{text-align:center;font-size:8px;margin-top:8px;border-top:1px dashed #222;padding-top:5px}",
        "</style></head><body><div class='receipt'>",
        "<div class='store-name'>TOKO YAKIN</div>",
        "<div class='store-tag'>✦ Grosir dan Eceran ✦</div>",
        "<div class='store-tag'>Jl. Ciseupan no 68</div>",
        "<div class='store-tag'>081312419920</div>",
        "<div class='print-date'>" + dateStr + "  •  " + timeStr + "</div>",
        "<div class='divider'></div>",
        "<div class='receipt-header'><span class='item-name'>Product Name</span><span class='item-sub'>Sub</span></div>",
        receiptItems.map(function (item) {
          return "<div class='receipt-item'><span class='item-name'>" + esc(item.name) + "</span><span class='item-sub'>" + esc(item.type) + "</span></div>" +
                 "<div class='receipt-item receipt-sub-row'><span class='item-name'>Rp" + item.singlePrice + " x " + item.qty + "</span><span class='item-sub'>Rp" + item.subtotal + "</span></div>";
        }).join(""),
        "<div class='total-row'><span>TOTAL</span><div style='margin-right:8px'>Rp" + grandTotal + "</div></div>",
        uangPembeli > 0
          ? "<div class='receipt-item' style='margin-top:4px;'><span class='item-name'>Uang Pembeli</span><span class='item-sub'>Rp" + uangPembeli.toFixed(2) + "</span></div>" +
            "<div class='receipt-item' style='font-weight:bold;'><span class='item-name'>Kembalian</span><span class='item-sub'>Rp" + (uangPembeli - grandTotal).toFixed(2) + "</span></div>"
          : "",
        "<div class='footer'>🧾 Terima kasih!<br/>Simpan struk ini sebagai bukti</div>",
        "</div><script>window.onload=function(){window.print();setTimeout(function(){window.close();},800);};</scr" + "ipt></body></html>"
      ].join("");

      var printWindow = window.open("", "_blank", "width=400,height=600,toolbar=no,menubar=no,scrollbars=yes");
      if (printWindow) {
        printWindow.document.write(printHtml);
        printWindow.document.close();
      } else {
        alert("⚠️ Popup blocked! Please allow popups for this site to print receipt.");
      }
    },

    // ================= QTY SUGGEST POPUP =================
    onQtyFocus(barcode, event) {
      var prod = S.products[barcode];
      if (!prod) return;
      var input = event.target;
      var tiers = prod.tiers || [];
      var mins = new Set([3, 5, 10]);
      var tierMins = [];
      tiers.forEach(function (t) {
        if (t.min > 0) { mins.add(t.min); tierMins.push(t.min); }
      });
      var sorted = Array.from(mins).sort(function (a, b) { return a - b; });
      var list = sorted.map(function (min) {
        return { value: min, active: tierMins.indexOf(min) !== -1 };
      });
      var rect = input.getBoundingClientRect();
      S.qtyPopup = {
        show: true,
        x: Math.max(4, rect.left),
        y: rect.bottom + 4,
        list: list,
        anchor: input,
        barcode: barcode,
        popupEl: S.qtyPopup.popupEl || null
      };
    },

    onQtyBlur() {
      setTimeout(function () {
        if (!S.qtyPopup.show) return;
        var popupEl = S.qtyPopup.popupEl;
        var anchor = S.qtyPopup.anchor;
        var active = document.activeElement;
        if (anchor && popupEl && !popupEl.contains(active) && !anchor.contains(active)) {
          S.hideQtyPopup();
        }
      }, 150);
    },

    qtySuggestPick(min, barcode) {
      var prod = S.products[barcode];
      if (prod) {
        S.addToCart(prod, min);
        S.showToast("➕ Added " + min + "x " + prod.name + " to cart");
      }
      S.hideQtyPopup();
    },

    hideQtyPopup() {
      S.qtyPopup = { show: false, x: 0, y: 0, list: [], anchor: null, barcode: null, popupEl: S.qtyPopup.popupEl || null };
    },

    // ================= FIRST VISIBLE ADD (Enter key) =================
    addFirstVisibleProduct(firstBarcode) {
      if (S.isLoading) { S.showToast("⏳ Loading products, please wait..."); return; }
      if (!firstBarcode) {
        S.showToast("⚠️ No matching products. Adjust your search.");
        return;
      }
      var prod = S.products[firstBarcode];
      if (!prod) return;
      var inCart = S.qtyInCart(firstBarcode);
      if (inCart > 0) {
        S.cartInc(firstBarcode);
        S.showToast('✨ [ENTER] +1 "' + prod.name + '"');
      } else {
        S.addToCart(prod, 1);
        S.showToast('✨ [ENTER] Added "' + prod.name + '" to cart');
      }
    }
  };

  S = V.reactive(S);
  window.store = S;

  var _debounceTimer = null;
  V.watch(
    function () { return store.cart; },
    function () {
      clearTimeout(_debounceTimer);
      _debounceTimer = setTimeout(function () { store.persistCurrentCart(); }, 300);
    },
    { deep: true }
  );
  V.watch(
    function () { return store.customer; },
    function () {
      clearTimeout(_debounceTimer);
      _debounceTimer = setTimeout(function () { store.persistCurrentCart(); }, 300);
    }
  );
})();