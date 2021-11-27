const { response } = require("express");

let db;
const request = window.indexedDB.open('budget-trackr', 1);

function checkForIndexedDb() {
    indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;

    if (!window.indexDB) {
        console.log(`Your browser doesn't support a stable version of IndexedDB.`);
        return false;
    }
    return true;
}
console.log(checkForIndexedDb);

request.onupgradeneeded = ({ target }) => {
    db = target.result;
    const pendingStore = db.createObjectStore('PendingStore', { autoIncrement: true });
    console.log(pendingStore);
};

request.onsuccess = ({ target }) => {
    db = target.result;
   
    if (navigator.onLine) {
        checkDatabase();
    }
};

request.onerror = function(e) {
    console.log(`Error: ${e.target.errorCode}`)
};

function saveRecord(record) {
    const transaction = db.transaction(['PendingStore'], 'readwrite');
    const store = transaction.objectStore('PendingStore');

    store.add(record);
}
console.log(saveRecord);

function checkDatabase() {
    const transaction = db.transaction(['PendingStore'], 'readwrite');
    const store = transaction.objectStore('PendingStore');
    const getAll = store.getAll();

    getAll.onsuccess = function() {
        if (getAll.result.length > 0) {
            fetch('/api/transaction/bulk', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
            .then((response) => response.json())
            .then(() => {
                if (response.length !== 0) {
                    transaction = db.transaction(['PendingStore'], 'readwrites');
                    const currentStore = transaction.objectStore('PendingStore');
                    currentStore.clear();
                }
            });
        }
    };
}

window.addEventListener('online', checkDatabase);

