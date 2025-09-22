// db.js
const DB_NAME = 'planner-db';
const DB_VERSION = 1;
let db;

function openDB(){
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = e => {
      const d = e.target.result;
      if(!d.objectStoreNames.contains('txns')){
        const s = d.createObjectStore('txns', { keyPath: 'id', autoIncrement: true });
        s.createIndex('byDate', 'date');
        s.createIndex('byType', 'type');
      }
      if(!d.objectStoreNames.contains('goals')){
        d.createObjectStore('goals', { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = e => { db = e.target.result; resolve(db); };
    req.onerror = e => reject(e.target.error);
  });
}

function txn(storeName, mode='readonly'){
  return db.transaction(storeName, mode).objectStore(storeName);
}

async function addItem(storeName, item){
  await openDBIfNeeded();
  return new Promise((res, rej) => {
    const r = txn(storeName, 'readwrite').add(item);
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}

async function putItem(storeName, item){
  await openDBIfNeeded();
  return new Promise((res, rej) => {
    const r = txn(storeName, 'readwrite').put(item);
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}

async function getAll(storeName){
  await openDBIfNeeded();
  return new Promise((res, rej) => {
    const req = txn(storeName).getAll();
    req.onsuccess = () => res(req.result || []);
    req.onerror = () => rej(req.error);
  });
}

async function deleteItem(storeName, id){
  await openDBIfNeeded();
  return new Promise((res, rej) => {
    const r = txn(storeName, 'readwrite').delete(id);
    r.onsuccess = () => res();
    r.onerror = () => rej(r.error);
  });
}

async function clearStore(storeName){
  await openDBIfNeeded();
  return new Promise((res, rej) => {
    const r = txn(storeName, 'readwrite').clear();
    r.onsuccess = () => res();
    r.onerror = () => rej(r.error);
  });
}

async function openDBIfNeeded(){ if(!db) await openDB(); }