// IndexedDB helpers: cart store ("carts") + image cache store ("imgs").
(function () {
  "use strict";

  var DB_NAME = "toko-yakin";
  var DB_VERSION = 1;
  var IMG_DB_NAME = "toko-yakin-img";
  var IMG_DB_VERSION = 1;

  function openCartDB() {
    return new Promise(function (resolve, reject) {
      var req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = function (e) {
        var db = e.target.result;
        if (!db.objectStoreNames.contains("carts")) {
          db.createObjectStore("carts", { keyPath: "id" });
        }
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
  }

  function dbPut(data) {
    return openCartDB().then(function (db) {
      var tx = db.transaction("carts", "readwrite");
      tx.objectStore("carts").put(data);
      return new Promise(function (resolve, reject) {
        tx.oncomplete = function () { db.close(); resolve(); };
        tx.onerror = function () { db.close(); reject(tx.error); };
      });
    }).catch(function (err) {
      console.warn("DB put failed:", err && err.name ? err.name + ": " + err.message : err);
    });
  }

  function dbGet(id) {
    return openCartDB().then(function (db) {
      var tx = db.transaction("carts", "readonly");
      var req = tx.objectStore("carts").get(id);
      return new Promise(function (resolve, reject) {
        req.onsuccess = function () { db.close(); resolve(req.result); };
        req.onerror = function () { db.close(); reject(req.error); };
      });
    }).catch(function () { return null; });
  }

  function dbGetAll() {
    return openCartDB().then(function (db) {
      var tx = db.transaction("carts", "readonly");
      var req = tx.objectStore("carts").getAll();
      return new Promise(function (resolve, reject) {
        req.onsuccess = function () { db.close(); resolve(req.result || []); };
        req.onerror = function () { db.close(); reject(req.error); };
      });
    }).catch(function () { return []; });
  }

  function dbDelete(id) {
    return openCartDB().then(function (db) {
      var tx = db.transaction("carts", "readwrite");
      tx.objectStore("carts").delete(id);
      return new Promise(function (resolve, reject) {
        tx.oncomplete = function () { db.close(); resolve(); };
        tx.onerror = function () { db.close(); reject(tx.error); };
      });
    }).catch(function (err) {
      console.warn("DB delete failed:", err && err.name ? err.name + ": " + err.message : err);
    });
  }

  function openImageDB() {
    return new Promise(function (resolve, reject) {
      var req = indexedDB.open(IMG_DB_NAME, IMG_DB_VERSION);
      req.onupgradeneeded = function (e) {
        var db = e.target.result;
        if (!db.objectStoreNames.contains("imgs")) db.createObjectStore("imgs");
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
  }

  function imgDBPut(key, blob) {
    return openImageDB().then(function (db) {
      var tx = db.transaction("imgs", "readwrite");
      tx.objectStore("imgs").put(blob, key);
      return new Promise(function (resolve, reject) {
        tx.oncomplete = function () { db.close(); resolve(); };
        tx.onerror = function () { db.close(); reject(tx.error); };
      });
    }).catch(function () {});
  }

  function imgDBGet(key) {
    return openImageDB().then(function (db) {
      var tx = db.transaction("imgs", "readonly");
      var req = tx.objectStore("imgs").get(key);
      return new Promise(function (resolve, reject) {
        req.onsuccess = function () { db.close(); resolve(req.result); };
        req.onerror = function () { db.close(); reject(req.error); };
      });
    }).catch(function () { return null; });
  }

  window.DB = {
    put: dbPut,
    get: dbGet,
    getAll: dbGetAll,
    delete: dbDelete,
    imagePut: imgDBPut,
    imageGet: imgDBGet
  };
})();