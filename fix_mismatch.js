const fs = require('fs');

const content = fs.readFileSync('backend/src/store.ts', 'utf-8');

// match everything in bookableSlots
const slotsMatch = content.match(/export const bookableSlots: BookableSlot\[\] = \[\n([\s\S]*?)\];\n\n\/\/ ── Bookings/);
if (!slotsMatch) {
  console.log("Could not find slots block");
  process.exit(1);
}

const slotsStr = slotsMatch[1];
const slotRegex = /{\s*id: "(s-\d+)",\s*venueId: "(v-\d+)",\s*date: (formatDate\(-?\d+\)|".*?"),\s*startTime: "(.*?)",\s*endTime: "(.*?)",\s*budget: (\d+),\s*status: "(Pending|Booked)",\s*performerId: "(p-\d+)",\s*}/g;

let newBookings = '';
let bookingCounter = 1000;

let match;
while ((match = slotRegex.exec(slotsStr)) !== null) {
  const [_, slotId, venueId, date, startTime, endTime, budget, status, performerId] = match;
  const bookingStatus = status === 'Pending' ? 'Pending' : 'Confirmed';
  
  newBookings += `  {
    id: "b-${bookingCounter++}",
    slotId: "${slotId}",
    venueId: "${venueId}",
    performerId: "${performerId}",
    date: ${date},
    startTime: "${startTime}",
    endTime: "${endTime}",
    budget: ${budget},
    status: "${bookingStatus}",
    createdAt: formatDate(0),
  },\n`;
}

// insert newBookings at the end of the bookings array
const bookingsRegex = /(\/\/ ── Bookings ─────────────────────────────\nexport const bookings: Booking\[\] = \[\n[\s\S]*?)(\];\n\n\/\/ ── Messages)/;
const newContent = content.replace(bookingsRegex, `$1${newBookings}$2`);

fs.writeFileSync('backend/src/store.ts', newContent);
console.log(`Added ${bookingCounter - 1000} corresponding bookings to fix mismatch.`);
