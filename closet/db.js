/* IndexedDB helpers for Closet. Everything stays on-device. */
(() => {
  const DB_NAME = "closet.db.v1";
  const DB_VER = 1;
  let _db;

  function openDB() {
    if (_db) return Promise.resolve(_db);
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VER);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains("kv")) db.createObjectStore("kv");
        if (!db.objectStoreNames.contains("items")) db.createObjectStore("items", { keyPath: "id" });
        if (!db.objectStoreNames.contains("outfits")) db.createObjectStore("outfits", { keyPath: "id" });
      };
      req.onsuccess = () => { _db = req.result; resolve(_db); };
      req.onerror = () => reject(req.error);
    });
  }

  function txDone(tx) {
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }

  async function kvGet(key) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const req = db.transaction("kv", "readonly").objectStore("kv").get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function kvSet(key, value) {
    const db = await openDB();
    const tx = db.transaction("kv", "readwrite");
    tx.objectStore("kv").put(value, key);
    return txDone(tx);
  }

  async function itemsAll() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const req = db.transaction("items", "readonly").objectStore("items").getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async function itemsPut(item) {
    const db = await openDB();
    const tx = db.transaction("items", "readwrite");
    tx.objectStore("items").put(item);
    return txDone(tx);
  }

  async function itemsDelete(id) {
    const db = await openDB();
    const tx = db.transaction("items", "readwrite");
    tx.objectStore("items").delete(id);
    return txDone(tx);
  }

  async function outfitsAll() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const req = db.transaction("outfits", "readonly").objectStore("outfits").getAll();
      req.onsuccess = () => {
        const rows = req.result || [];
        rows.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        resolve(rows);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async function outfitsPut(outfit) {
    const db = await openDB();
    const tx = db.transaction("outfits", "readwrite");
    tx.objectStore("outfits").put(outfit);
    return txDone(tx);
  }

  async function outfitsDelete(id) {
    const db = await openDB();
    const tx = db.transaction("outfits", "readwrite");
    tx.objectStore("outfits").delete(id);
    return txDone(tx);
  }

  window.ClosetDB = {
    openDB, kvGet, kvSet, itemsAll, itemsPut, itemsDelete, outfitsAll, outfitsPut, outfitsDelete
  };
})();
