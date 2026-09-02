// Keyboard shortcuts modal — view & customize all shortcuts.
(function () {
  "use strict";

  window.KeyboardShortcutsModal = {
    name: "KeyboardShortcutsModal",
    template: `
      <div v-if="store.shortcutsModalOpen" class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center transition-opacity duration-200" @click.self="close">
        <div class="bg-gray-800 rounded-xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden mx-4 border border-gray-700 shadow-2xl">
          <div class="flex items-center justify-between p-4 border-b border-gray-700 shrink-0 rounded-t-xl bg-gray-800 z-10">
            <h3 class="text-lg font-bold flex items-center gap-2">
              <svg class="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              Keyboard Shortcuts
            </h3>
            <button class="text-gray-400 hover:text-white text-xl leading-none p-1" @click="close">&times;</button>
          </div>
          <div class="overflow-y-auto flex-1 p-4 space-y-1.5">
            <div v-for="s in store.customShortcuts" :key="s.id" class="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-700/40 transition group">
              <span class="text-sm text-gray-300">{{ s.label }}</span>
              <div v-if="editingId === s.id">
                <button
                  class="px-3 py-1 text-xs font-mono font-semibold rounded-md bg-yellow-600 text-white animate-pulse min-w-[80px] text-center"
                  @keydown.prevent="captureKey($event, s)"
                  ref="keyInputs"
                >Press keys...</button>
              </div>
              <div v-else class="flex items-center gap-2">
                <kbd class="px-2 py-0.5 text-xs font-mono font-semibold rounded-md bg-gray-600 text-gray-100 border border-gray-500">{{ s.key }}</kbd>
                <button v-if="!readonly" class="opacity-0 group-hover:opacity-100 text-xs text-yellow-400 hover:text-yellow-300 transition" @click="startEdit(s.id)">Edit</button>
              </div>
            </div>
          </div>
          <div class="flex items-center justify-between p-4 border-t border-gray-700 shrink-0 rounded-b-xl bg-gray-800 z-10">
            <button v-if="!readonly" class="text-xs text-red-400 hover:text-red-300 transition" @click="resetAll">Reset to Default</button>
            <span v-else></span>
            <div class="flex items-center gap-2">
              <label class="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer select-none">
                <input type="checkbox" v-model="readonly" class="rounded bg-gray-600 border-gray-500 text-yellow-500 focus:ring-yellow-500">
                Read-only
              </label>
              <button class="px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-600 hover:bg-gray-500 text-gray-200 transition" @click="close">Close</button>
            </div>
          </div>
        </div>
      </div>
    `,
    data() {
      return { editingId: null, readonly: true };
    },
    methods: {
      close() {
        store.shortcutsModalOpen = false;
        this.editingId = null;
      },
      startEdit(id) {
        this.editingId = id;
        var self = this;
        this.$nextTick(function () {
          var inputs = self.$refs.keyInputs;
          if (inputs && inputs.length > 0) { inputs[0].focus(); }
          else if (inputs) { inputs.focus(); }
        });
      },
      captureKey(e, shortcut) {
        var parts = [];
        if (e.ctrlKey) parts.push("Ctrl");
        if (e.altKey) parts.push("Alt");
        if (e.shiftKey) parts.push("Shift");
        if (e.metaKey) parts.push("Meta");
        var key = e.key;
        if (["Control", "Alt", "Shift", "Meta"].indexOf(key) === -1) {
          if (key === " ") key = "Space";
          else if (key === "Escape") { this.editingId = null; return; }
          parts.push(key);
          shortcut.key = parts.join("+");
          store.saveShortcuts();
          this.editingId = null;
        }
      },
      resetAll() {
        if (!confirm("Reset all shortcuts to default?")) return;
        store.resetShortcuts();
        this.editingId = null;
        store.showToast("Shortcuts reset to default");
      }
    }
  };
})();
