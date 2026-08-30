// Floating quantity-suggestion popup shown when a product qty input is focused.
(function () {
  "use strict";
  window.QuantitySuggest = {
    name: "QuantitySuggest",
    template: `
      <div v-show="store.qtyPopup.show" class="fixed z-50" :style="{ left: store.qtyPopup.x + 'px', top: store.qtyPopup.y + 'px' }" ref="el">
        <div class="bg-gray-800 border border-gray-600/80 rounded-lg shadow-xl p-1.5 flex gap-1">
          <button
            v-for="b in store.qtyPopup.list"
            :key="b.value"
            class="qty-suggest-btn px-3 py-1.5 text-sm font-semibold rounded-md transition"
            :class="b.active ? 'bg-green-700 hover:bg-green-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-200'"
            @mousedown.prevent
            @click="store.qtySuggestPick(b.value, store.qtyPopup.barcode)"
          >{{ b.value }}</button>
        </div>
      </div>
    `,
    mounted() {
      store.qtyPopup.popupEl = this.$refs.el;
    },
    updated() {
      store.qtyPopup.popupEl = this.$refs.el;
    },
    beforeUnmount() {
      if (store.qtyPopup.popupEl === this.$refs.el) {
        store.qtyPopup.popupEl = null;
      }
    }
  };
})();