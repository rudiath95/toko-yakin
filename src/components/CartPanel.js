// Right cart sidebar: cart table, customer/uang inputs, totals and checkout.
(function () {
  "use strict";

  window.CartPanel = {
    name: "CartPanel",
    template: `
      <div :class="[
        'fixed top-0 right-0 w-full md:w-[40%] h-full bg-gray-800/95 backdrop-blur-sm border-l border-gray-700 shadow-2xl flex flex-col z-30 transition-transform duration-300 ease-in-out',
        store.cartOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
      ]">
        <div class="px-3 md:px-5 pt-6 pb-3 border-b border-gray-700/80">
          <h2 class="text-xl font-bold flex items-center gap-2">
            <svg class="w-5 h-5 text-blue-400 hidden md:inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 6M17 13l1.5 6M9 21h6M12 15v6" />
            </svg>
            <span class="hidden md:inline">Shopping Cart</span>
            <div class="ml-auto flex items-center gap-1">
              <button class="text-xs font-medium text-white bg-green-700 hover:bg-green-600 px-2 py-1 rounded-md transition" title="Add custom product" @click="openCustomProduct">
                <svg class="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
                <span class="mobile-hidden">Custom</span>
              </button>
              <button class="text-xs font-medium text-gray-300 hover:text-white bg-gray-700/50 hover:bg-gray-600 px-2 py-1 rounded-md transition" title="Export cart to clipboard" @click="store.exportCart()">
                <svg class="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                <span class="mobile-hidden">Export</span>
              </button>
              <button class="text-xs font-medium text-gray-300 hover:text-white bg-gray-700/50 hover:bg-gray-600 px-2 py-1 rounded-md transition" title="Import cart from clipboard" @click="store.importCart()">
                <svg class="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 3v12" /></svg>
                <span class="mobile-hidden">Import</span>
              </button>
              <button class="text-xs font-medium text-emerald-300 hover:text-white bg-emerald-700/50 hover:bg-emerald-600 px-2 py-1 rounded-md transition" title="Save cart as new entry" @click="store.saveNamedCart()">
                <svg class="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                <span class="mobile-hidden">Save</span>
              </button>
              <button class="text-xs font-medium text-blue-300 hover:text-white bg-blue-700/50 hover:bg-blue-600 px-2 py-1 rounded-md transition" title="Browse saved carts" @click="store.openSavedCarts()">
                <svg class="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                <span class="mobile-hidden">Load</span>
              </button>
              <button class="text-xs font-normal text-red-400 hover:text-red-300 bg-gray-700/50 hover:bg-red-900/50 px-2.5 py-1 rounded-md transition flex items-center gap-1" title="Clear all" @click="onClearCart">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                <span class="mobile-hidden">Clear</span>
              </button>
              <button class="md:hidden text-gray-400 hover:text-white bg-gray-700/50 hover:bg-gray-600 rounded-lg p-1.5 transition" title="Close cart" @click="store.cartOpen = false">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </h2>
        </div>

        <div class="flex-1 overflow-y-auto px-0 md:px-4 py-3 cart-scroll">
          <div class="overflow-x-auto">
            <table class="w-full text-sm border-collapse">
              <thead class="bg-gray-700/60 sticky top-0 z-10 backdrop-blur-sm">
                <tr class="text-left text-gray-200 font-semibold text-xs uppercase tracking-wider">
                  <th class="px-2 py-2.5 text-center w-6">#</th>
                  <th class="px-2 py-2.5 hidden md:table-cell">Barcode</th>
                  <th class="px-2 py-2.5">Name</th>
                  <th class="px-2 py-2.5 text-center">Qty</th>
                  <th class="px-2 py-2.5 hidden md:table-cell">Unit</th>
                  <th class="px-2 py-2.5">Subtotal</th>
                  <th class="px-2 py-2.5 text-center">Info</th>
                  <th class="px-2 py-2.5 text-center">Act</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-700/50">
                <tr
                  v-for="(item, idx) in store.cart"
                  :key="item.barcode"
                  class="border-b border-gray-700/50 hover:bg-gray-700/30 transition"
                  :class="{ dragging: dragFrom === item.barcode, 'drag-over': dragOver === item.barcode }"
                  draggable="true"
                  @dragstart="onDragStart(item, $event)"
                  @dragover.prevent="onDragOver(item)"
                  @dragleave="dragOver = null"
                  @drop.prevent="onDrop(item)"
                  @dragend="onDragEnd"
                >
                  <td class="px-1 py-2.5 text-center w-6">
                    <span class="drag-handle text-gray-400 text-lg leading-none select-none" title="Drag to reorder">⋮</span>
                  </td>
                  <td class="px-2 py-2.5 font-mono text-xs text-gray-300 hidden md:table-cell">
                    <span v-if="item.type === 'custom'" class="text-yellow-400">Custom</span>
                    <template v-else>{{ item.barcode }}</template>
                  </td>
                  <td class="px-2 py-2.5 font-medium text-gray-200">{{ item.name }}</td>
                  <td class="px-2 py-2.5 text-center">
                    <div class="inline-flex items-center gap-1 bg-gray-700/50 rounded-lg shadow-inner">
                      <button class="decrease w-7 h-7 rounded-l-lg bg-gray-700 hover:bg-gray-600 text-white font-bold text-sm" @click="store.cartDec(item.barcode)">−</button>
                      <span class="w-8 text-center text-sm font-semibold">{{ item.qty }}</span>
                      <button class="increase w-7 h-7 rounded-r-lg bg-gray-700 hover:bg-gray-600 text-white font-bold text-sm" @click="store.cartInc(item.barcode)">+</button>
                    </div>
                  </td>
                  <td class="px-2 py-2.5 text-xs text-emerald-300 font-mono hidden md:table-cell">Rp. {{ item.singlePrice.toFixed(2) }}</td>
                  <td class="px-2 py-2.5 font-mono text-emerald-400 font-semibold">Rp. {{ itemSubtotal(item).toFixed(2) }}</td>
                  <td class="px-2 py-2.5 text-center">
                    <button class="details-btn bg-gray-700/80 hover:bg-gray-600 text-white rounded-md px-2 py-1 text-xs transition-colors shadow-sm" @click="showDetails(item)">📋 Details</button>
                  </td>
                  <td class="px-2 py-2.5 text-center">
                    <button class="remove-cart-btn bg-red-800/70 hover:bg-red-700 text-white rounded-md w-7 h-7 flex items-center justify-center text-sm font-bold transition shadow-sm" title="Remove item from cart" @click="store.cartRemove(item.barcode)">✖</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-if="store.cart.length === 0" class="text-center text-gray-500 py-8 text-sm">Cart is empty — add products</div>
        </div>

        <div class="border-t border-gray-700/80 px-3 md:px-5 py-5 bg-gray-800/90 flex-shrink-0">
          <div class="flex justify-between items-center mb-3">
            <label for="customer" class="text-gray-300 text-sm font-medium">Customer</label>
            <input
              type="text"
              id="customer"
              v-model="store.customer"
              class="w-40 text-right bg-gray-700/80 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
              placeholder="e.g. John"
            >
          </div>
          <div class="flex justify-between items-center mb-4 text-base font-bold">
            <span class="text-gray-300">Total</span>
            <span class="text-2xl font-extrabold text-emerald-400 tracking-tight">Rp. {{ cartTotal.toFixed(2) }}</span>
          </div>
          <div class="flex justify-between items-center mb-3">
            <label for="uangPembeli" class="text-gray-300 text-sm font-medium">Uang Pembeli</label>
            <input
              type="number"
              id="uangPembeli"
              v-model="store.uangPembeli"
              class="w-40 text-right bg-gray-700/80 text-white px-3 py-2 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              placeholder="e.g. 100000" min="0" inputmode="numeric"
              @focus="$event.target.select()"
            >
          </div>
          <div class="flex justify-between items-center mb-4 text-base font-bold">
            <span class="text-gray-300">Kembalian</span>
            <span class="text-2xl font-extrabold tracking-tight" :class="kembalian < 0 ? 'text-red-400' : 'text-yellow-400'">Rp. {{ kembalian.toFixed(2) }}</span>
          </div>
          <button class="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-2.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2" @click="store.showThermalReceipt()">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            CheckOut
          </button>
        </div>
      </div>
    `,

    data() {
      return { dragFrom: null, dragOver: null };
    },

    computed: {
      cartTotal() {
        var t = 0;
        store.cart.forEach(function (item) {
          t += Pricing.compute(item.singlePrice, item.tiers, item.qty).total;
        });
        return t;
      },
      kembalian() {
        return (parseFloat(store.uangPembeli) || 0) - this.cartTotal;
      }
    },

    methods: {
      openCustomProduct() {
        store.customName = "";
        store.customSubtotal = "";
        store.customModalOpen = true;
      },
      onClearCart() {
        if (store.cart.length === 0) return;
        if (!confirm("Clear all items from cart?")) return;
        store.clearCart();
        store.showToast("🗑️ Cart cleared");
      },
      itemSubtotal(item) {
        return Pricing.compute(item.singlePrice, item.tiers, item.qty).total;
      },
      showDetails(item) {
        var res = Pricing.compute(item.singlePrice, item.tiers, item.qty);
        var lines = Pricing.breakdownLines(res.breakdown);
        var subtotal = res.total;
        alert("🧾 PRICE BREAKDOWN — " + item.name + " (QTY: " + item.qty + ")\n\n" + lines.join("\n") + "\n────────────────\n💰 SUBTOTAL: Rp. " + subtotal.toFixed(2));
      },
      onDragStart(item, event) {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", item.barcode);
        this.dragFrom = item.barcode;
      },
      onDragOver(item) {
        this.dragOver = item.barcode;
      },
      onDrop(item) {
        if (this.dragFrom && this.dragFrom !== item.barcode) {
          store.reorderCart(this.dragFrom, item.barcode);
        }
        this.dragOver = null;
        this.dragFrom = null;
      },
      onDragEnd() {
        this.dragOver = null;
        this.dragFrom = null;
      }
    }
  };
})();