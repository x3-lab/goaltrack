if (typeof globalThis.localStorage === 'undefined') {
  globalThis.localStorage = {
    store: {},
    length: 0,
    key(index) {
      return Object.keys(this.store)[index] || null;
    },
    getItem(key) {
      return this.store[key] || null;
    },
    setItem(key, value) {
      this.store[key] = value;
      this.length = Object.keys(this.store).length;
    },
    removeItem(key) {
      delete this.store[key];
      this.length = Object.keys(this.store).length;
    },
    clear() {
      this.store = {};
      this.length = 0;
    },
  };
}
