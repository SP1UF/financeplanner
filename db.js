let dbPromise=null;
function getDB(){
  if(!dbPromise){
    dbPromise=new Promise((resolve,reject)=>{
      const req=indexedDB.open("FinancePlannerDB",2);
      req.onupgradeneeded=e=>{
        const db=e.target.result;
        if(!db.objectStoreNames.contains("txns")) db.createObjectStore("txns",{keyPath:"id",autoIncrement:true});
        if(!db.objectStoreNames.contains("payments")) db.createObjectStore("payments",{keyPath:"id",autoIncrement:true});
        if(!db.objectStoreNames.contains("payouts")) db.createObjectStore("payouts",{keyPath:"id",autoIncrement:true});
      };
      req.onsuccess=e=>resolve(e.target.result);
      req.onerror=e=>reject(e.target.error);
    });
  }
  return dbPromise;
}
async function add(store,value){ const db=await getDB(); return new Promise((res,rej)=>{ const tx=db.transaction(store,"readwrite"); tx.objectStore(store).add(value); tx.oncomplete=()=>res(); tx.onerror=e=>rej(e); }); }
async function getAll(store){ const db=await getDB(); return new Promise((res,rej)=>{ const tx=db.transaction(store,"readonly"); const req=tx.objectStore(store).getAll(); req.onsuccess=e=>res(e.target.result); req.onerror=e=>rej(e); }); }
async function remove(store,id){ const db=await getDB(); return new Promise((res,rej)=>{ const tx=db.transaction(store,"readwrite"); tx.objectStore(store).delete(id); tx.oncomplete=()=>res(); tx.onerror=e=>rej(e); }); }
