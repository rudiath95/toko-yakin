// Root App: composes panels/modals, init (sheets, autosave, SW, keyboard, resize).
(function () {
  "use strict";

  var AUTOSAVE_INTERVAL = 10000;

  window.App = {
    name: "App",
    template: `
      <div>
        <!-- offline banner -->
        <div v-if="store.offlineMode" class="fixed top-0 left-0 right-0 z-50 bg-red-600/90 backdrop-blur-sm text-white text-center text-xs font-semibold py-1.5 tracking-wide shadow-lg">
          📴 OFFLINE MODE — using cached data
        </div>

        <product-browser ref="browser"></product-browser>
        <cart-panel></cart-panel>

        <!-- mobile cart backdrop -->
        <div v-show="store.cartOpen" class="fixed inset-0 bg-black/50 z-20 md:hidden transition-opacity duration-300" @click="store.cartOpen = false"></div>

        <saved-carts-modal></saved-carts-modal>
        <custom-product-modal></custom-product-modal>
        <quantity-suggest></quantity-suggest>

        <!-- mobile cart toggle button -->
        <button
          v-show="!store.cartOpen"
          class="fixed top-4 right-4 md:hidden z-30 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-lg w-12 h-12 shadow-lg flex items-center justify-center transition-all"
          @click="store.cartOpen = true"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 6M17 13l1.5 6M9 21h6M12 15v6" />
          </svg>
          <span v-if="store.cart.length > 0" class="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">{{ store.cart.length }}</span>
        </button>

        <!-- toast -->
        <div v-if="store.toast" class="toast-notify">{{ store.toast }}</div>
      </div>
    `,
    components: {
      ProductBrowser: window.ProductBrowser,
      CartPanel: window.CartPanel,
      SavedCartsModal: window.SavedCartsModal,
      CustomProductModal: window.CustomProductModal,
      QuantitySuggest: window.QuantitySuggest
    },
    mounted() {
      this.init();
    },
    beforeUnmount() {
      clearInterval(this._autosaveTimer);
      window.removeEventListener("keydown", this._onKey);
      window.removeEventListener("resize", this._onResize);
      document.removeEventListener("click", this._onDocClick);
    },
    methods: {
      async init() {
        await store.loadInitialCart();

        if ("serviceWorker" in navigator) {
          navigator.serviceWorker.register("sw.js").catch(function (e) {
            console.warn("Service worker registration failed:", e);
          });
        }

        this._autosaveTimer = setInterval(function () { store.autosaveCart(); }, AUTOSAVE_INTERVAL);
        store.autosaveCart();

        this._onKey = (e) => this.handleKey(e);
        this._onResize = () => { store.isMobile = window.innerWidth < 768; };
        this._onDocClick = (e) => this.handleDocClick(e);
        window.addEventListener("keydown", this._onKey);
        window.addEventListener("resize", this._onResize);
        document.addEventListener("click", this._onDocClick);

        try {
          await store.loadSheetData("Biasa");
          if (Object.keys(store.allProducts["Biasa"] || {}).length === 0) throw new Error("No products");
          await store.loadSheetData("Grosir");
        } catch (err) {
          console.warn("Online sheet load failed, auto-switching to offline", err);
          if (store.useGoogleSource) {
            store.goOffline("online sheet unreachable or timed out");
          }
          try {
            await store.loadSheetData("Biasa");
            if (Object.keys(store.allProducts["Biasa"] || {}).length === 0) throw new Error("No products");
            await store.loadSheetData("Grosir");
          } catch (err2) {
            console.warn("Local sheet load failed, using fallback demo", err2);
            store.insertFallbackDemo();
          }
        }
        store.renderCombinedView();
        store.prefetchImages();
        this.$nextTick(function () {
          var input = document.querySelector('input[placeholder="Search by barcode or name..."]');
          if (input) input.focus();
        });
      },

      handleKey(e) {
        if (e.key === "Escape") {
          if (store.cartOpen) store.cartOpen = false;
          store.hideQtyPopup();
          return;
        }
        if (e.altKey) {
          var viewMap = { "1": "combined", "2": "biasa", "3": "grosir" };
          var view = viewMap[e.key];
          if (view) {
            e.preventDefault();
            store.switchView(view);
          } else if (e.key === "4") {
            e.preventDefault();
            store.toggleOnlineMode();
          } else if (e.key === "5") {
            e.preventDefault();
            store.syncSheet();
          }
        }
      },

      handleDocClick(e) {
        var popup = store.qtyPopup;
        if (popup.show && popup.anchor) {
          var popupEl = popup.popupEl;
          if (popupEl && !popupEl.contains(e.target) && !popup.anchor.contains(e.target)) {
            store.hideQtyPopup();
          }
        }
      }
    }
  };
})();