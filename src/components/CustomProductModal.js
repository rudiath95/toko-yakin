// Custom product modal (add a name + subtotal item to cart).
(function () {
  "use strict";

  window.CustomProductModal = {
    name: "CustomProductModal",
    template: `
      <div v-if="store.customModalOpen" class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center transition-opacity duration-200" @click.self="close">
        <div class="bg-gray-800 rounded-xl w-full max-w-lg mx-4 border border-gray-700 shadow-2xl">
          <div class="flex items-center justify-between p-4 border-b border-gray-700">
            <h3 class="text-lg font-bold flex items-center gap-2">
              <svg class="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
              Custom Product
            </h3>
            <button class="text-gray-400 hover:text-white text-xl leading-none p-1" @click="close">&times;</button>
          </div>
          <div class="p-4 space-y-4">
            <div>
              <label for="customProductName" class="block text-sm font-medium text-gray-300 mb-1">Product Name</label>
              <input
                id="customProductName"
                ref="nameInput"
                type="text"
                v-model="localName"
                class="w-full bg-gray-700/80 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 placeholder-gray-500"
                placeholder="e.g. Custom Service"
                @keydown.enter="focusSubtotal"
              >
            </div>
            <div>
              <label for="customProductSubtotal" class="block text-sm font-medium text-gray-300 mb-1">Subtotal (Rp)</label>
              <input
                id="customProductSubtotal"
                ref="subtotalInput"
                type="number"
                v-model="localSubtotal"
                class="w-full bg-gray-700/80 text-white px-3 py-2 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-yellow-500 placeholder-gray-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="e.g. 50000" min="0" inputmode="numeric"
                @keydown.enter.prevent="confirm"
              >
            </div>
            <div class="pt-2">
              <button class="w-full bg-green-700 hover:bg-green-600 text-white font-semibold py-2 rounded-lg transition" @click="confirm">Add to Cart</button>
            </div>
          </div>
        </div>
      </div>
    `,
    data() {
      return { localName: "", localSubtotal: "" };
    },
    watch: {
      "store.customModalOpen": function (val) {
        if (val) {
          this.localName = "";
          this.localSubtotal = "";
          this.$nextTick(() => this.$refs.nameInput && this.$refs.nameInput.focus());
        }
      }
    },
    methods: {
      focusSubtotal() {
        this.$nextTick(() => this.$refs.subtotalInput && this.$refs.subtotalInput.focus());
      },
      close() {
        store.customModalOpen = false;
      },
      confirm() {
        var name = this.localName.trim();
        var subtotal = parseFloat(this.localSubtotal) || 0;
        if (!name) { alert("Please enter a product name."); return; }
        if (subtotal <= 0) { alert("Please enter a valid subtotal."); return; }
        store.addCustomProduct(name, subtotal);
        store.customModalOpen = false;
        store.showToast("➕ Added custom product \"" + name + "\" (Rp. " + subtotal.toFixed(2) + ") to cart");
        this.$nextTick(function () {
          var input = document.querySelector('input[placeholder="Search by barcode or name..."]');
          if (input) { input.focus(); input.select(); }
        });
      }
    }
  };
})();