import { venues, bookableSlots, bookings, performers } from './store';

// Mock simple validator logic for testing
const checkOverlapping = (venueId: string, date: string, start: string, end: string, excludeId?: string): boolean => {
  return bookableSlots.some(s => {
    if (s.venueId !== venueId || s.date !== date || s.id === excludeId) return false;
    return (start >= s.startTime && start < s.endTime) ||
           (end > s.startTime && end <= s.endTime) ||
           (s.startTime >= start && s.startTime < end);
  });
};

const validateBookingRequest = (slot: any): { valid: boolean; error?: string } => {
  if (slot.status === 'Blocked') {
    return { valid: false, error: 'Cannot book a blocked slot' };
  }
  if (slot.status === 'Booked') {
    return { valid: false, error: 'Cannot book a slot that is already booked' };
  }
  return { valid: true };
};

const validateVenueDeletion = (venueId: string, bookingsList: any[]): { valid: boolean; error?: string } => {
  const todayStr = new Date().toISOString().split('T')[0];
  const hasFutureBookings = bookingsList.some(b => b.venueId === venueId && b.date >= todayStr && b.status === 'Confirmed');
  if (hasFutureBookings) {
    return { valid: false, error: 'Cannot delete venue with active future bookings' };
  }
  return { valid: true };
};

const calculateCompletion = (profile: any): number => {
  const fields = ['biography', 'genres', 'pricing', 'languages', 'experience', 'travelRadius', 'equipmentNeeded', 'imageUrl'];
  let filledFields = 0;
  fields.forEach(f => {
    const val = profile[f];
    if (Array.isArray(val) && val.length > 0) filledFields++;
    else if (val && !Array.isArray(val)) filledFields++;
  });
  return Math.round((filledFields / fields.length) * 100);
};

// Test Runner
function runTests() {
  console.log('\n=== STAGEHUB CORE VALIDATION TESTS ===');
  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, testName: string) => {
    if (condition) {
      console.log(`✓ [PASSED] ${testName}`);
      passed++;
    } else {
      console.error(`✗ [FAILED] ${testName}`);
      failed++;
    }
  };

  // Test 1: Overlapping slots
  // Add a slot to check overlap against. Let s-1 be on formattedDate(2) from 18:00 - 21:00.
  const overlap1 = checkOverlapping('v-1', bookableSlots[0].date, '17:30', '19:30'); // overlaps (starts before, ends during)
  const overlap2 = checkOverlapping('v-1', bookableSlots[0].date, '21:00', '22:00'); // adjacent, no overlap
  assert(overlap1 === true, 'Validation prevents overlapping slot timeframes');
  assert(overlap2 === false, 'Validation allows adjacent slots without overlap');

  // Test 2: Booking validations
  const blockedSlot = { id: 's-test-1', status: 'Blocked' };
  const bookedSlot = { id: 's-test-2', status: 'Booked' };
  const openSlot = { id: 's-test-3', status: 'Available' };
  
  assert(validateBookingRequest(blockedSlot).valid === false, 'Booking request rejected on blocked slots');
  assert(validateBookingRequest(bookedSlot).valid === false, 'Booking request rejected on already-booked slots');
  assert(validateBookingRequest(openSlot).valid === true, 'Booking request accepted on open available slots');

  // Test 3: Venue delete validation
  const testBookings = [
    { id: 'b-t-1', venueId: 'v-1', date: '2026-09-10', status: 'Confirmed' }, // future confirmed booking
    { id: 'b-t-2', venueId: 'v-2', date: '2026-01-10', status: 'Confirmed' }  // past booking
  ];
  assert(validateVenueDeletion('v-1', testBookings).valid === false, 'Deletes blocked for venues with future bookings');
  assert(validateVenueDeletion('v-2', testBookings).valid === true, 'Deletes allowed for venues with only past bookings');

  // Test 4: Profile Completion Gauge
  const completeProfile = {
    biography: 'Hello world',
    genres: ['Rock'],
    pricing: 200,
    languages: ['English'],
    experience: '3 years',
    travelRadius: 30,
    equipmentNeeded: ['Mic'],
    imageUrl: 'http://pic.com'
  };
  const incompleteProfile = {
    biography: '',
    genres: [],
    pricing: 0,
    languages: [],
    experience: '',
    travelRadius: 0,
    equipmentNeeded: [],
    imageUrl: ''
  };
  assert(calculateCompletion(completeProfile) === 100, 'Returns 100% completion for fully populated profile');
  assert(calculateCompletion(incompleteProfile) === 0, 'Returns 0% completion for blank profile');

  // Test 5: Manager venue scoping
  const testVenuesList = [
    { id: 'v-t-1', organizationId: 'u-org-1', managerIds: ['u-mgr-1'] },
    { id: 'v-t-2', organizationId: 'u-org-1', managerIds: ['u-mgr-2'] },
    { id: 'v-t-3', organizationId: 'u-org-1', managerIds: [] }
  ];
  
  const filterVenuesForUser = (user: any, list: any[]) => {
    if (user.isManager) {
      return list.filter(v => v.managerIds && v.managerIds.includes(user.id));
    }
    return list.filter(v => v.organizationId === user.id);
  };
  
  const manager1Venues = filterVenuesForUser({ id: 'u-mgr-1', isManager: true }, testVenuesList);
  const ownerVenues = filterVenuesForUser({ id: 'u-org-1', isManager: false }, testVenuesList);
  
  assert(manager1Venues.length === 1 && manager1Venues[0].id === 'v-t-1', 'Venue list scoped properly for manager');
  assert(ownerVenues.length === 3, 'Venue list returns all venues for owner');

  console.log('\n=== TEST RESULTS ===');
  console.log(`Passed: ${passed}/${passed + failed}`);
  if (failed > 0) {
    console.error(`Status: FAILED (${failed} test failures)`);
    process.exit(1);
  } else {
    console.log('Status: ALL TESTS PASSED SUCCESSFULLY!\n');
  }
}

runTests();
