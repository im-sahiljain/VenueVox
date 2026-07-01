const fs = require('fs');

const venues = ['v-1', 'v-2', 'v-5', 'v-3', 'v-4'];
const statuses = ['Available', 'Pending', 'Booked', 'Blocked'];

let newSlots = '';
let idCounter = 1000;

for (let v of venues) {
  for (let d = -15; d <= 15; d++) {
    // skip some days to make it look realistic
    if (Math.random() < 0.4) continue;
    
    // add 1 to 3 slots per day
    let slotsPerDay = Math.floor(Math.random() * 3) + 1;
    let currentHour = 17; // start at 5 PM

    for (let s = 0; s < slotsPerDay; s++) {
      let status = statuses[Math.floor(Math.random() * statuses.length)];
      let budget = Math.floor(Math.random() * 200) + 100;
      
      let startTime = `${currentHour}:00`;
      let endTime = `${currentHour + 2}:00`;
      
      newSlots += `  {
    id: "s-${idCounter++}",
    venueId: "${v}",
    date: formatDate(${d}),
    startTime: "${startTime}",
    endTime: "${endTime}",
    budget: ${budget},
    status: "${status}",
    performerId: ${status === 'Booked' || status === 'Pending' ? '"p-1"' : 'null'},
  },\n`;
  
      currentHour += 2;
    }
  }
}

let storeContent = fs.readFileSync('backend/src/store.ts', 'utf-8');
// Assuming the previous script replaced the line with `// ── Bookable Slots ─────────────────────`
storeContent = storeContent.replace(/\/\/ ── Bookable Slots ─────────────────────\nexport const bookableSlots: BookableSlot\[\] = \[\n([\s\S]*?)\];/, `// ── Bookable Slots ─────────────────────\nexport const bookableSlots: BookableSlot[] = [\n${newSlots}];`);
fs.writeFileSync('backend/src/store.ts', storeContent);
console.log('Added dummy slots across past and future');
