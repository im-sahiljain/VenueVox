require('ts-node').register();
const store = require('./src/store.ts');
const slotIds = new Set(store.bookableSlots.map(s => s.id));
const missing = store.bookings.filter(b => !slotIds.has(b.slotId));
console.log(missing.map(b => b.id + " -> " + b.slotId));
