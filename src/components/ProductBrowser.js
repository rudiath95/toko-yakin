// Left panel: store header, view toggles, search, product table/grid with pagination.
(function () {
  "use strict";

  function p(barcode) { return store.products[barcode]; }

  window.ProductBrowser = {
    name: "ProductBrowser",
    template: `
      <div class="md:mr-[40%]">
        <div class="p-6 pb-12">
          <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
            <h1 class="text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-100 to-gray-300 bg-clip-text text-transparent flex items-center gap-2">
              Toko Yakin
              <button class="text-gray-400 hover:text-yellow-400 transition p-1 rounded-lg hover:bg-gray-700/50" title="Keyboard Shortcuts" @click="store.shortcutsModalOpen = true">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              </button>
              <a href="https://github.com/rudiath95/toko-yakin/releases/latest/download/TokoYakin-POS.apk"
                 class="desktop-hidden inline-flex items-center gap-1 px-3 py-1 text-sm font-semibold rounded-md bg-green-700 hover:bg-green-600 text-white shadow transition"
                 target="_blank" title="Download Android APK">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                APK
              </a>
            </h1>
            <!-- VIEW TOGGLE BUTTONS (Combined / Biasa / Grosir) -->
            <div class="bg-gray-800/60 border border-gray-700 rounded-xl p-1 shadow-md flex gap-1">
              <button @click="switchView('combined')" :class="viewBtnClass('combined')" :disabled="store.isLoading" :title="'All products (' + store.getShortcutKey('viewAll') + ')'">👥 All</button>
              <button @click="switchView('biasa')" :class="viewBtnClass('biasa')" :disabled="store.isLoading" :title="'Biasa (' + store.getShortcutKey('viewBiasa') + ')'">📄 Biasa</button>
              <button @click="switchView('grosir')" :class="viewBtnClass('grosir')" :disabled="store.isLoading" :title="'Grosir (' + store.getShortcutKey('viewGrosir') + ')'">📦 Grosir</button>
              <button class="px-2.5 py-2 text-sm font-semibold rounded-lg transition-all duration-200 shadow-sm inline-flex items-center gap-1" :class="store.offlineMode ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'" :title="(store.offlineMode ? 'Offline mode — tap for online' : 'Online mode — tap for offline') + ' (' + store.getShortcutKey('toggleMode') + ')'" @click="store.toggleOnlineMode()">
                {{ store.offlineMode ? '📴' : '🌐' }}
                <span v-if="store.offlineMode" class="text-[10px] font-bold uppercase tracking-wider animate-pulse">Offline</span>
              </button>
              <button class="inline-flex px-3 py-2 text-sm font-semibold rounded-lg transition-all duration-200 bg-gray-700 text-gray-200 hover:bg-gray-600 items-center gap-1" title="Download latest spreadsheet from Google Sheets" @click="store.syncSheet()">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                Sync
              </button>
            </div>
          </div>

          <div class="bg-gray-800/40 rounded-xl border border-gray-700/60 shadow-xl overflow-hidden">
            <!-- search bar + bulk columns toggle control -->
            <div class="p-4 border-b border-gray-700/50 bg-gray-800/30 flex flex-wrap items-center justify-between gap-3">
              <div class="relative flex-1 min-w-[200px]">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  ref="searchInput"
                  type="text"
                  placeholder="Search by barcode or name..."
                  class="w-full bg-gray-900 border border-gray-600 rounded-lg py-2 pl-9 pr-8 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  v-model="store.searchTerm"
                  @keydown.enter.prevent="onSearchEnter"
                >
                <button v-if="store.searchTerm" class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-lg leading-none" @click="clearSearch">&times;</button>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-xs text-white bg-gray-800/60 px-2.5 py-1 rounded-full">{{ searchCountLabel }}</span>
                <button v-if="store.layoutMode === 'list'" class="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-700 hover:bg-gray-600 transition flex items-center gap-1 shadow-sm" @click="toggleBulkColumns">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                  <span>{{ store.showBulkColumns ? 'Hide Bulk Columns' : 'Show Bulk Columns' }}</span>
                </button>
                <button class="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-700 hover:bg-gray-600 transition flex items-center gap-1 shadow-sm" :title="store.layoutMode === 'thumbnail' ? 'Switch to list view' : 'Switch to thumbnail view'" @click="toggleLayout">
                  <svg v-if="store.layoutMode === 'list'" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h4v4H3zm7 0h4v4h-4zm7 0h4v4h-4zM3 10h4v4H3zm7 0h4v4h-4zm7 0h4v4h-4zM3 17h4v4H3zm7 0h4v4h-4zm7 0h4v4h-4z" /></svg>
                  <svg v-else class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 500 470"><path fill="currentColor" d="M487.2,69.7c0,12.9-10.5,23.4-23.4,23.4h-322c-12.9,0-23.4-10.5-23.4-23.4s10.5-23.4,23.4-23.4h322.1C476.8,46.4,487.2,56.8,487.2,69.7z M463.9,162.3H141.8c-12.9,0-23.4,10.5-23.4,23.4s10.5,23.4,23.4,23.4h322.1c12.9,0,23.4-10.5,23.4-23.4C487.2,172.8,476.8,162.3,463.9,162.3z M463.9,278.3H141.8c-12.9,0-23.4,10.5-23.4,23.4s10.5,23.4,23.4,23.4h322.1c12.9,0,23.4-10.5,23.4-23.4C487.2,288.8,476.8,278.3,463.9,278.3z M463.9,394.3H141.8c-12.9,0-23.4,10.5-23.4,23.4s10.5,23.4,23.4,23.4h322.1c12.9,0,23.4-10.5,23.4-23.4C487.2,404.8,476.8,394.3,463.9,394.3z M38.9,30.8C17.4,30.8,0,48.2,0,69.7s17.4,39,38.9,39s38.9-17.5,38.9-39S60.4,30.8,38.9,30.8z M38.9,146.8C17.4,146.8,0,164.2,0,185.7s17.4,38.9,38.9,38.9s38.9-17.4,38.9-38.9S60.4,146.8,38.9,146.8z M38.9,262.8C17.4,262.8,0,280.2,0,301.7s17.4,38.9,38.9,38.9s38.9-17.4,38.9-38.9S60.4,262.8,38.9,262.8z M38.9,378.7C17.4,378.7,0,396.1,0,417.6s17.4,38.9,38.9,38.9s38.9-17.4,38.9-38.9C77.8,396.2,60.4,378.7,38.9,378.7z" /></svg>
                  <span>{{ store.layoutMode === 'thumbnail' ? 'List' : 'Grid' }}</span>
                </button>
              </div>
            </div>

            <!-- product table (list) -->
            <div v-if="store.layoutMode === 'list'" class="overflow-x-auto">
              <table class="product-table w-full text-sm border-collapse">
                <thead class="bg-gray-800 border-b border-gray-700">
                  <tr class="text-left text-gray-300 font-semibold">
                    <th class="px-4 py-3 hidden md:table-cell">Barcode</th>
                    <th class="px-4 py-3">Name</th>
                    <th class="px-4 py-3 hidden md:table-cell">Category</th>
                    <th class="px-4 py-3">Price</th>
                    <th class="px-4 py-3 hidden md:table-cell" :style="bulkCellStyle()">Min (B1)</th>
                    <th class="px-4 py-3 hidden md:table-cell" :style="bulkCellStyle()">Bulk 1 (total)</th>
                    <th class="px-4 py-3 hidden md:table-cell" :style="bulkCellStyle()">Min (B2)</th>
                    <th class="px-4 py-3 hidden md:table-cell" :style="bulkCellStyle()">Bulk 2 (total)</th>
                    <th class="px-4 py-3 hidden md:table-cell" :style="bulkCellStyle()">Min (B3)</th>
                    <th class="px-4 py-3 hidden md:table-cell" :style="bulkCellStyle()">Bulk 3 (total)</th>
                    <th class="px-4 py-3 hidden md:table-cell">Qty</th>
                    <th class="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-800/70 bg-gray-900/50">
                  <tr v-for="barcode in visible" :key="barcode" :class="rowClasses(barcode, p(barcode))">
                    <td class="px-4 py-2.5 font-mono text-xs hidden md:table-cell">{{ p(barcode).barcode }}</td>
                    <td class="px-4 py-2.5 font-medium">{{ p(barcode).name }}</td>
                    <td class="px-4 py-2.5 text-gray-300 hidden md:table-cell">{{ p(barcode).category }}</td>
                    <td class="px-4 py-2.5 font-mono text-emerald-300">{{ p(barcode).singlePrice > 0 ? 'Rp. ' + p(barcode).singlePrice.toFixed(2) : '-' }}</td>
                    <td class="px-4 py-2.5 hidden md:table-cell" :style="bulkCellStyle()">{{ tierOf(p(barcode),0).min || '-' }}</td>
                    <td class="px-4 py-2.5 font-mono text-blue-300 text-xs hidden md:table-cell" :style="bulkCellStyle()">{{ formatBulk(tierOf(p(barcode),0)) }}</td>
                    <td class="px-4 py-2.5 hidden md:table-cell" :style="bulkCellStyle()">{{ tierOf(p(barcode),1).min || '-' }}</td>
                    <td class="px-4 py-2.5 font-mono text-blue-300 text-xs hidden md:table-cell" :style="bulkCellStyle()">{{ formatBulk(tierOf(p(barcode),1)) }}</td>
                    <td class="px-4 py-2.5 hidden md:table-cell" :style="bulkCellStyle()">{{ tierOf(p(barcode),2).min || '-' }}</td>
                    <td class="px-4 py-2.5 font-mono text-blue-300 text-xs hidden md:table-cell" :style="bulkCellStyle()">{{ formatBulk(tierOf(p(barcode),2)) }}</td>
                    <td class="px-4 py-2.5 hidden md:table-cell">
                      <input type="number" min="1"
                             class="qty-input w-20 px-2 py-1.5 bg-gray-800 border border-gray-600 rounded-md text-white focus:ring-1 focus:ring-blue-500 outline-none"
                             :value="qtyInputValue(barcode)"
                             @focus="onQtyFocus(barcode, $event)"
                             @blur="store.onQtyBlur()"
                             @input="setQtyInput(barcode, $event)"
                             @keydown.enter.prevent="addProduct(barcode)">
                    </td>
                    <td class="px-4 py-2.5">
                      <div v-if="store.qtyInCart(barcode) > 0" class="inline-flex items-center gap-0.5 bg-green-800/60 rounded-lg shadow-inner border border-green-600/40">
                        <button class="w-7 h-7 rounded-l-lg bg-green-700 hover:bg-green-600 text-white font-bold text-sm leading-none transition" @click.stop="store.cartDec(barcode)">−</button>
                        <span class="w-8 text-center text-sm font-semibold text-white">{{ store.qtyInCart(barcode) }}</span>
                        <button class="w-7 h-7 rounded-r-lg bg-green-700 hover:bg-green-600 text-white font-bold text-sm leading-none transition" @click.stop="store.cartInc(barcode)">+</button>
                      </div>
                      <button v-else class="add-btn bg-green-700 hover:bg-green-600 text-white text-sm px-3 py-1.5 rounded-lg shadow-md transition flex items-center gap-1" @click="addProduct(barcode)">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                        Add
                      </button>
                    </td>
                  </tr>
                  <tr v-if="showSentinel" ref="sentinel">
                    <td :colspan="visibleCols" class="text-center py-4 text-gray-500 text-xs">
                      <span class="loading-shimmer inline-block px-8 py-2 rounded">Loading more...</span>
                    </td>
                  </tr>
                  <tr v-if="noResults" class="bg-gray-800/40">
                    <td :colspan="visibleCols" class="text-center py-10 text-gray-400 italic">🔍 No products match "{{ store.searchTerm }}"</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- product grid (thumbnail) -->
            <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
              <div v-for="barcode in visible" :key="barcode"
                   class="product-thumb bg-gray-800/60 border-2 border-gray-700/60 rounded-xl overflow-hidden hover:border-blue-500/50 transition-all"
                   :class="thumbRingClass(barcode)">
                <div class="w-full aspect-square bg-gray-900 overflow-hidden flex items-center justify-center" :class="{ 'no-image-placeholder': !!store.imgFailed[barcode] }">
                  <img
                    v-if="p(barcode).imageUrl && !store.imgFailed[barcode]"
                    class="w-full h-full object-cover"
                    :src="p(barcode).imageUrl"
                    :alt="p(barcode).name"
                    loading="lazy"
                    @error="store.onImgError(barcode, $event)"
                  >
                </div>
                <div class="p-3 space-y-1.5">
                  <div class="font-medium text-sm leading-tight line-clamp-2">{{ p(barcode).name }}</div>
                  <div class="font-mono text-emerald-300 text-sm font-semibold">{{ p(barcode).singlePrice > 0 ? 'Rp. ' + p(barcode).singlePrice.toFixed(2) : '-' }}</div>
                  <div class="flex items-center gap-1.5 mt-1">
                    <input type="number" min="1"
                           class="qty-input w-[30%] min-w-0 px-2 py-1 bg-gray-800 border border-gray-600 rounded-md text-white text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                           :value="qtyInputValue(barcode)"
                           @focus="onQtyFocus(barcode, $event)"
                           @blur="store.onQtyBlur()"
                           @input="setQtyInput(barcode, $event)"
                           @keydown.enter.prevent="addProduct(barcode)">
                    <div class="flex-1">
                      <div v-if="store.qtyInCart(barcode) > 0" class="inline-flex items-center gap-0.5 bg-green-800/60 rounded-lg shadow-inner border border-green-600/40">
                        <button class="w-7 h-7 rounded-l-lg bg-green-700 hover:bg-green-600 text-white font-bold text-sm leading-none transition" @click.stop="store.cartDec(barcode)">−</button>
                        <span class="w-8 text-center text-sm font-semibold text-white">{{ store.qtyInCart(barcode) }}</span>
                        <button class="w-7 h-7 rounded-r-lg bg-green-700 hover:bg-green-600 text-white font-bold text-sm leading-none transition" @click.stop="store.cartInc(barcode)">+</button>
                      </div>
                      <button v-else class="add-btn bg-green-700 hover:bg-green-600 text-white text-sm px-3 py-1.5 rounded-lg shadow-md transition flex items-center gap-1 w-full justify-center" @click="addProduct(barcode)">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div v-if="noResults" class="col-span-full text-center py-10 text-gray-400 italic">🔍 No products match "{{ store.searchTerm }}"</div>
            </div>
          </div>
        </div>
      </div>
    `,

    data() {
      return {
        _obs: null
      };
    },

    computed: {
      filtered() {
        var term = (store.searchTerm || "").trim().toLowerCase();
        var keys = Object.keys(store.products);
        if (!term) return keys;
        return keys.filter(function (barcode) {
          var prod = store.products[barcode];
          if (!prod) return false;
          return String(prod.barcode).toLowerCase().indexOf(term) !== -1 ||
                 String(prod.name).toLowerCase().indexOf(term) !== -1;
        });
      },
      visible() {
        if (store.layoutMode === "thumbnail") return this.filtered;
        return this.filtered.slice(0, store.loadedCount);
      },
      showSentinel() {
        return store.layoutMode === "list" && this.filtered.length > store.loadedCount;
      },
      noResults() {
        return this.filtered.length === 0;
      },
      visibleCols() {
        if (store.isMobile) return store.showBulkColumns ? 3 + 6 : 3;
        return store.showBulkColumns ? 12 : 12 - 6;
      },
      searchCountLabel() {
        if (!store.searchTerm) return "All (" + Object.keys(store.products).length + ")";
        return this.filtered.length + " / " + Object.keys(store.products).length + " found";
      }
    },

    watch: {
      filtered: {
        handler() {
          this.$nextTick(() => this.setupObserver());
        },
        deep: true
      },
      "store.searchTerm"() {
        this.resetPagination();
      }
    },

    mounted() {
      this.$nextTick(() => this.setupObserver());
      this._onDocClick = (e) => {
        var target = e.target;
        if (!target || !target.closest) return;
        if (!target.closest("button")) return;
        if (target.closest("input, textarea, select")) return;
        if (target.closest("[data-no-search-focus]")) return;
        this.focusSearch();
      };
      document.addEventListener("click", this._onDocClick, true);
    },
    updated() {
      this.$nextTick(() => this.setupObserver());
    },
    beforeUnmount() {
      if (this._obs) { this._obs.disconnect(); this._obs = null; }
      document.removeEventListener("click", this._onDocClick, true);
    },

    methods: {
      p: p,
      resetPagination() {
        store.loadedCount = 0;
        store.loadNextBatch(this.filtered.length);
        this.$nextTick(() => this.setupObserver());
      },
      viewBtnClass(view) {
        return store.viewMode === view
          ? "px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 bg-blue-600 text-white shadow-sm"
          : "px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 bg-gray-700 text-gray-200 hover:bg-gray-600";
      },
      switchView(view) {
        if (store.isLoading) return;
        store.switchView(view);
        this.$nextTick(() => { if (this.$refs.searchInput) { this.$refs.searchInput.focus(); this.$refs.searchInput.select(); } });
      },
      clearSearch() {
        store.searchTerm = "";
        this.$nextTick(() => { if (this.$refs.searchInput) { this.$refs.searchInput.focus(); this.$refs.searchInput.select(); } });
      },
      focusSearch() {
        this.$nextTick(() => {
          var si = this.$refs.searchInput;
          if (si && document.activeElement !== si) { si.focus(); si.select(); }
        });
      },
      onSearchEnter() {
        store.addFirstVisibleProduct(this.filtered[0]);
        this.$nextTick(() => { var si = this.$refs.searchInput; if (si) { si.focus(); si.select(); } });
      },
      toggleBulkColumns() {
        store.showBulkColumns = !store.showBulkColumns;
      },
      toggleLayout() {
        store.layoutMode = store.layoutMode === "list" ? "thumbnail" : "list";
        store.loadedCount = 0;
        store.loadNextBatch(this.filtered.length);
        this.$nextTick(() => { if (this.$refs.searchInput) { this.$refs.searchInput.focus(); this.$refs.searchInput.select(); } });
      },
      rowClasses(barcode, prod) {
        var isKrt = prod && prod.type === "KRT";
        var cls = "product-row hover:bg-gray-800/40 transition-colors";
        if (store.viewMode === "combined" && store.allProducts["Grosir"] && store.allProducts["Grosir"][barcode]) cls += " bg-gray-800/70";
        if (isKrt) cls += " text-red-400";
        return cls;
      },
      thumbRingClass(barcode) {
        var hasGrosir = store.viewMode === "combined" && store.allProducts["Grosir"] && !!store.allProducts["Grosir"][barcode];
        var isKrt = p(barcode) && p(barcode).type === "KRT";
        if (hasGrosir) return "ring-1 ring-green-500/30";
        if (isKrt) return "ring-1 ring-red-500/30";
        return "";
      },
      tierOf(prod, idx) {
        if (!prod) return {};
        return (prod.tiers || [])[idx] || {};
      },
      formatBulk(tier) {
        if (!tier || !tier.min || !tier.totalPrice || isNaN(tier.min) || isNaN(tier.totalPrice) || tier.totalPrice <= 0) return "-";
        return "Rp. " + tier.totalPrice.toFixed(2);
      },
      bulkCellStyle() {
        return store.showBulkColumns && !store.isMobile ? { display: "table-cell" } : { display: "none" };
      },
      qtyInputValue(barcode) {
        return store.qtyInputs[barcode] || 1;
      },
      setQtyInput(barcode, event) {
        var v = parseInt(event.target.value, 10);
        store.qtyInputs[barcode] = isNaN(v) || v < 1 ? 1 : v;
      },
      onQtyFocus(barcode, event) {
        var input = event.target;
        input.select();
        store.onQtyFocus(barcode, event);
      },
      addProduct(barcode) {
        var prod = p(barcode);
        if (!prod) return;
        var qty = store.qtyInputs[barcode] || 1;
        store.addToCart(prod, qty);
        store.qtyInputs[barcode] = 1;
        store.showToast("➕ Added " + qty + "x " + prod.name + " to cart");
        this.$nextTick(() => { if (this.$refs.searchInput) { this.$refs.searchInput.focus(); this.$refs.searchInput.select(); } });
      },
      setupObserver() {
        if (this._obs) { this._obs.disconnect(); this._obs = null; }
        var el = this.$refs.sentinel;
        if (!el) return;
        var self = this;
        this._obs = new IntersectionObserver(function (entries) {
          if (entries[0] && entries[0].isIntersecting) store.loadNextBatch(self.filtered.length);
        }, { rootMargin: "200px" });
        this._obs.observe(el);
      }
    }
  };
})();