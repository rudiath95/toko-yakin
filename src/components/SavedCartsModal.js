// Saved carts modal with Saved / Autosaved tabs.
(function () {
  "use strict";

  window.SavedCartsModal = {
    name: "SavedCartsModal",
    template: `
      <div v-if="store.savedCartsOpen" class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center transition-opacity duration-200" @click.self="store.closeSavedCarts()">
        <div class="bg-gray-800 rounded-xl w-full max-w-lg max-h-[70vh] flex flex-col overflow-hidden mx-4 border border-gray-700 shadow-2xl">
          <div class="flex items-center justify-between p-4 border-b border-gray-700 shrink-0 rounded-t-xl bg-gray-800 z-10">
            <h3 class="text-lg font-bold flex items-center gap-2">
              <svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              Saved Carts
            </h3>
            <button class="text-gray-400 hover:text-white text-xl leading-none p-1" @click="store.closeSavedCarts()">&times;</button>
          </div>
          <div class="flex shrink-0">
            <button class="flex-1 py-2.5 text-sm font-semibold transition border-b-2" :class="tabClass('saved')" @click="store.savedCartsTab = 'saved'">Saved</button>
            <button class="flex-1 py-2.5 text-sm font-semibold transition border-b-2" :class="tabClass('autosaved')" @click="store.savedCartsTab = 'autosaved'">Autosaved</button>
          </div>
          <div class="divide-y divide-gray-700/60 overflow-y-auto">
            <template v-if="store.savedCartsTab === 'saved'">
              <div v-if="store.savedCarts.length === 0" class="text-center py-8 text-gray-500 text-sm">No saved carts yet</div>
              <div v-else v-for="e in store.savedCarts" :key="e.id" class="flex items-center justify-between px-4 py-3 hover:bg-gray-700/40 transition">
                <div class="min-w-0 flex-1">
                  <div class="font-semibold text-gray-200 truncate">{{ e.customer || "Unknown" }}</div>
                  <div class="text-xs text-gray-400">{{ e.date || "" }} · {{ (e.items || []).length }} item(s)</div>
                </div>
                <div class="flex items-center gap-1 ml-3">
                  <button class="load-saved-btn text-xs font-medium text-blue-300 hover:text-white bg-blue-700/50 hover:bg-blue-600 px-2.5 py-1.5 rounded-md transition" @click="store.loadSavedCart(e.id)">Load</button>
                  <button class="delete-saved-btn text-xs font-medium text-red-400 hover:text-white bg-red-700/50 hover:bg-red-600 px-2 py-1.5 rounded-md transition" @click="store.deleteSavedCart(e.id)">&times;</button>
                </div>
              </div>
            </template>
            <template v-else>
              <div v-if="store.autosavedCarts.length === 0" class="text-center py-8 text-gray-500 text-sm">No autosaved carts yet</div>
              <div v-else v-for="e in store.autosavedCarts" :key="e.id" class="flex items-center justify-between px-4 py-3 hover:bg-gray-700/40 transition">
                <div class="min-w-0 flex-1">
                  <div class="font-semibold text-gray-200 truncate flex items-center gap-2">
                    <span class="text-[10px] bg-blue-800/60 text-blue-200 px-1.5 py-0.5 rounded uppercase">Auto</span>
                    {{ e.date || "" }}
                  </div>
                  <div class="text-xs text-gray-400">{{ (e.items || []).length }} item(s){{ e.customer ? " · " + e.customer : "" }}</div>
                </div>
                <div class="flex items-center gap-1 ml-3">
                  <button class="load-saved-btn text-xs font-medium text-blue-300 hover:text-white bg-blue-700/50 hover:bg-blue-600 px-2.5 py-1.5 rounded-md transition" @click="store.loadSavedCart(e.id)">Load</button>
                  <button class="delete-saved-btn text-xs font-medium text-red-400 hover:text-white bg-red-700/50 hover:bg-red-600 px-2 py-1.5 rounded-md transition" @click="store.deleteSavedCart(e.id)">&times;</button>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    `,
    methods: {
      tabClass(tab) {
        return store.savedCartsTab === tab
          ? "border-blue-400 text-blue-300"
          : "border-transparent text-gray-400 hover:text-gray-200";
      }
    }
  };
})();