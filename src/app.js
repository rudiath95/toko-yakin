// Root App: composes panels/modals, init (sheets, autosave, SW, keyboard, resize).
(function () {
  "use strict";

  var AUTOSAVE_INTERVAL = 10000;

  window.App = {
    name: "App",
    template: `
      <div>
        <product-browser ref="browser"></product-browser>
        <cart-panel></cart-panel>

        <!-- mobile cart backdrop -->
        <div v-show="store.cartOpen" class="fixed inset-0 bg-black/50 z-20 md:hidden transition-opacity duration-300" @click="store.cartOpen = false"></div>

        <saved-carts-modal></saved-carts-modal>
        <custom-product-modal></custom-product-modal>
        <keyboard-shortcuts-modal></keyboard-shortcuts-modal>
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
      KeyboardShortcutsModal: window.KeyboardShortcutsModal,
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
          if (input) { input.focus(); input.select(); }
        });
      },

      handleKey(e) {
        var pressed = [];
        if (e.ctrlKey) pressed.push("Ctrl");
        if (e.altKey) pressed.push("Alt");
        if (e.shiftKey) pressed.push("Shift");
        if (e.metaKey) pressed.push("Meta");
        var k = e.key;
        if (k === " ") k = "Space";
        if (["Control", "Alt", "Shift", "Meta"].indexOf(e.key) === -1) pressed.push(k);
        var combo = pressed.join("+");

        function match(id) { return combo === store.getShortcutKey(id); }

        if (match("closeModal")) {
          if (store.shortcutsModalOpen) store.shortcutsModalOpen = false;
          else if (store.customModalOpen) store.customModalOpen = false;
          else if (store.savedCartsOpen) store.savedCartsOpen = false;
          else if (store.qtyPopup.show) store.hideQtyPopup();
          else if (store.cartOpen) store.cartOpen = false;
          var input = document.querySelector('input[placeholder="Search by barcode or name..."]');
          if (input) { input.focus(); input.select(); }
          return;
        }
        if (match("viewAll")) { e.preventDefault(); store.switchView("combined"); }
        else if (match("viewBiasa")) { e.preventDefault(); store.switchView("biasa"); }
        else if (match("viewGrosir")) { e.preventDefault(); store.switchView("grosir"); }
        else if (match("toggleMode")) { e.preventDefault(); store.toggleOnlineMode(); }
        else if (match("syncSheet")) { e.preventDefault(); store.syncSheet(); }
        else if (match("customProd")) {
          e.preventDefault();
          store.customName = "";
          store.customSubtotal = "";
          store.customModalOpen = true;
        }
        else if (match("saveCart")) { e.preventDefault(); store.saveNamedCart(); }
        else if (match("loadCart")) { e.preventDefault(); store.openSavedCarts(); }
        else if (match("clearCart")) {
          e.preventDefault();
          if (store.cart.length > 0 && confirm("Clear all items from cart?")) {
            store.clearCart();
            store.showToast("Cart cleared");
            var ci = document.querySelector('input[placeholder="Search by barcode or name..."]');
            if (ci) { ci.focus(); ci.select(); }
          }
        }
        else if (match("focusCustomer")) {
          e.preventDefault();
          var custInput = document.getElementById("customer");
          if (custInput) { custInput.focus(); custInput.select(); }
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