import express, { Request, Response } from 'express';
import cors from 'cors';
import {
  users,
  venues,
  bookableSlots,
  performers,
  bookings,
  messages,
  notifications,
  reviews,
  User,
  Venue,
  BookableSlot,
  Performer,
  Booking,
  Message,
  Notification,
  Review,
  voiceAssistants,
  voiceCallLogs
} from './store';
import webhookRoutes from './routes/webhook.routes';
import { provisionAssistant } from './services/assistant.service';
import { getCalls } from './services/vapi.service';
import { industryTemplates } from './templates/industries';
import { getConfig } from './config/env';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Helper for standard API response
const sendResponse = (res: Response, statusCode: number, success: boolean, data: any, message: string, errors: any = null) => {
  return res.status(statusCode).json({
    success,
    data,
    message,
    errors
  });
};

// -------------------------------------------------------------
// AUTHENTICATION MODULE
// -------------------------------------------------------------
app.post('/api/v1/auth/login', (req: Request, res: Response) => {
  const { email, password, role } = req.body;

  if (!email || !role) {
    return sendResponse(res, 400, false, null, 'Email and role are required', ['Missing fields']);
  }

  // Any password can login. Find or create user.
  let user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.role === role);

  if (!user) {
    // Register on the fly
    const id = `u-${role === 'organization' ? 'org' : 'perf'}-${Date.now()}`;
    const name = role === 'organization' ? 'New Venue Partner' : 'Rising Artist';
    const newUser: User = { id, email, role, name, password: 'password123' };
    users.push(newUser);
    user = newUser;

    // If performer, create a performer profile
    if (role === 'performer') {
      const performerId = `p-${Date.now()}`;
      const newPerformer: Performer = {
        id: performerId,
        userId: id,
        name: name,
        biography: 'No biography added yet.',
        genres: [],
        pricing: 100,
        languages: ['English'],
        experience: 'New Performer',
        travelRadius: 10,
        equipmentNeeded: [],
        imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
        completionPercentage: 10,
      };
      performers.push(newPerformer);
    }
  }

  // Fetch linked performer details if applicable
  let performerDetails = null;
  if (user && user.role === 'performer') {
    performerDetails = performers.find(p => p.userId === user?.id) || null;
  }

  return sendResponse(res, 200, true, {
    token: `mock-jwt-token-for-${user?.id}`,
    user,
    performer: performerDetails
  }, 'Login successful');
});

// -------------------------------------------------------------
// VENUE MODULE
// -------------------------------------------------------------
app.get('/api/v1/venues', (req: Request, res: Response) => {
  // Return all venues with voice assistant status attached
  const detailedVenues = venues.map(v => {
    const hasVoiceAssistant = voiceAssistants.some(a => a.organizationId === v.organizationId && a.status === 'active');
    return { ...v, hasVoiceAssistant };
  });
  return sendResponse(res, 200, true, detailedVenues, 'Venues retrieved successfully');
});

app.post('/api/v1/venues', (req: Request, res: Response) => {
  const { organizationId, name, address, description, capacity, type, equipment, policies, imageUrl } = req.body;

  if (!organizationId || !name || !address || !capacity || !type) {
    return sendResponse(res, 400, false, null, 'Required venue fields missing', ['Missing fields']);
  }

  const newVenue: Venue = {
    id: `v-${Date.now()}`,
    organizationId,
    name,
    address,
    description: description || '',
    capacity: Number(capacity),
    type,
    equipment: equipment || [],
    policies: policies || [],
    imageUrl: imageUrl || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&auto=format&fit=crop&q=80',
  };

  venues.push(newVenue);
  return sendResponse(res, 201, true, newVenue, 'Venue created successfully');
});

app.put('/api/v1/venues/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = venues.findIndex(v => v.id === id);

  if (index === -1) {
    return sendResponse(res, 404, false, null, 'Venue not found');
  }

  const updatedVenue = {
    ...venues[index],
    ...req.body,
    id // keep original ID
  };

  venues[index] = updatedVenue;
  return sendResponse(res, 200, true, updatedVenue, 'Venue updated successfully');
});

app.delete('/api/v1/venues/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const venueIndex = venues.findIndex(v => v.id === id);

  if (venueIndex === -1) {
    return sendResponse(res, 404, false, null, 'Venue not found');
  }

  // VALIDATION: Cannot delete venue with future bookings
  const todayStr = new Date().toISOString().split('T')[0];
  const hasFutureBookings = bookings.some(b => b.venueId === id && b.date >= todayStr && b.status === 'Confirmed');

  if (hasFutureBookings) {
    return sendResponse(res, 400, false, null, 'Cannot delete venue with active future bookings');
  }

  venues.splice(venueIndex, 1);
  return sendResponse(res, 200, true, null, 'Venue deleted successfully');
});

// -------------------------------------------------------------
// MANAGERS MODULE
// -------------------------------------------------------------
app.get('/api/v1/organizations/:orgId/managers', (req: Request, res: Response) => {
  const { orgId } = req.params;
  const orgManagers = users.filter(u => u.role === 'organization' && u.isManager && u.parentOrgId === orgId);
  const detailedManagers = orgManagers.map(m => {
    const assignedVenues = venues.filter(v => v.managerIds && v.managerIds.includes(m.id));
    return {
      ...m,
      assignedVenues: assignedVenues.map(v => ({ id: v.id, name: v.name }))
    };
  });
  return sendResponse(res, 200, true, detailedManagers, 'Managers retrieved successfully');
});

app.post('/api/v1/organizations/:orgId/managers', (req: Request, res: Response) => {
  const { orgId } = req.params;
  const { name, email, venueId } = req.body;

  if (!name || !email || !venueId) {
    return sendResponse(res, 400, false, null, 'Name, email, and venueId are required');
  }

  const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return sendResponse(res, 400, false, null, 'User with this email already exists');
  }

  const newManager: User = {
    id: `u-mgr-${Date.now()}`,
    email: email.toLowerCase(),
    role: 'organization',
    name,
    isManager: true,
    parentOrgId: orgId,
    password: 'password123'
  };

  users.push(newManager);

  const venue = venues.find(v => v.id === venueId);
  if (venue) {
    if (!venue.managerIds) {
      venue.managerIds = [];
    }
    venue.managerIds.push(newManager.id);
  }

  return sendResponse(res, 201, true, {
    ...newManager,
    assignedVenues: venue ? [{ id: venue.id, name: venue.name }] : []
  }, 'Manager created and assigned successfully');
});

// -------------------------------------------------------------
// CALENDAR & BOOKABLE SLOTS MODULE
// -------------------------------------------------------------
app.get('/api/v1/slots', (req: Request, res: Response) => {
  const { venueId } = req.query;
  let filtered = bookableSlots;
  if (venueId) {
    filtered = bookableSlots.filter(s => s.venueId === venueId);
  }
  return sendResponse(res, 200, true, filtered, 'Slots retrieved successfully');
});

// Discover / Search slots with filters
app.get('/api/v1/slots/discover', (req: Request, res: Response) => {
  const { location, date, budget, genre, venueType, equipment } = req.query;

  let results = bookableSlots.filter(s => s.status === 'Available');

  // Map slot details with venue and organization details
  let detailedResults = results.map(s => {
    const venue = venues.find(v => v.id === s.venueId);
    const org = users.find(u => u.id === venue?.organizationId);
    const hasVoiceAssistant = voiceAssistants.some(a => a.organizationId === venue?.organizationId && a.status === 'active');
    return {
      ...s,
      venue: venue ? { ...venue, hasVoiceAssistant } : null,
      organization: org ? { id: org.id, name: org.name } : null
    };
  });

  // Apply filters
  if (location) {
    detailedResults = detailedResults.filter(r =>
      r.venue?.address.toLowerCase().includes((location as string).toLowerCase())
    );
  }
  if (date) {
    detailedResults = detailedResults.filter(r => r.date === date);
  }
  if (budget) {
    detailedResults = detailedResults.filter(r => r.budget <= Number(budget));
  }
  if (venueType) {
    detailedResults = detailedResults.filter(r => r.venue?.type === venueType);
  }
  if (equipment) {
    detailedResults = detailedResults.filter(r =>
      r.venue?.equipment.some(e => e.toLowerCase().includes((equipment as string).toLowerCase()))
    );
  }

  return sendResponse(res, 200, true, detailedResults, 'Discover slots retrieved successfully');
});

// Helper validation: check if times overlap
const isOverlapping = (venueId: string, date: string, start: string, end: string, excludeId?: string) => {
  return bookableSlots.some(s => {
    if (s.venueId !== venueId || s.date !== date || s.id === excludeId) return false;
    // status block is also check-worthy
    return (start >= s.startTime && start < s.endTime) ||
           (end > s.startTime && end <= s.endTime) ||
           (s.startTime >= start && s.startTime < end);
  });
};

app.post('/api/v1/slots', (req: Request, res: Response) => {
  const { venueId, date, startTime, endTime, budget, status } = req.body;

  if (!venueId || !date || !startTime || !endTime || budget === undefined) {
    return sendResponse(res, 400, false, null, 'Missing parameters to create slot');
  }

  // VALIDATION: Cannot create overlapping slots
  if (isOverlapping(venueId, date, startTime, endTime)) {
    return sendResponse(res, 400, false, null, 'Slot schedule overlaps with an existing slot for this venue');
  }

  const newSlot: BookableSlot = {
    id: `s-${Date.now()}`,
    venueId,
    date,
    startTime,
    endTime,
    budget: Number(budget),
    status: status || 'Available',
    performerId: null,
  };

  bookableSlots.push(newSlot);
  return sendResponse(res, 201, true, newSlot, 'Bookable slot created successfully');
});

app.put('/api/v1/slots/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const slotIndex = bookableSlots.findIndex(s => s.id === id);

  if (slotIndex === -1) {
    return sendResponse(res, 404, false, null, 'Slot not found');
  }

  const existingSlot = bookableSlots[slotIndex];

  // VALIDATION: Check overlapping if date or times change
  const checkVenueId = req.body.venueId || existingSlot.venueId;
  const checkDate = req.body.date || existingSlot.date;
  const checkStart = req.body.startTime || existingSlot.startTime;
  const checkEnd = req.body.endTime || existingSlot.endTime;

  if (isOverlapping(checkVenueId, checkDate, checkStart, checkEnd, id)) {
    return sendResponse(res, 400, false, null, 'Updated slot schedule overlaps with an existing slot');
  }

  const updatedSlot = {
    ...existingSlot,
    ...req.body,
    id // keep original ID
  };

  bookableSlots[slotIndex] = updatedSlot;
  return sendResponse(res, 200, true, updatedSlot, 'Slot updated successfully');
});

app.delete('/api/v1/slots/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = bookableSlots.findIndex(s => s.id === id);

  if (index === -1) {
    return sendResponse(res, 404, false, null, 'Slot not found');
  }

  // VALIDATION: Cannot delete slot with future booked status
  if (bookableSlots[index].status === 'Booked') {
    return sendResponse(res, 400, false, null, 'Cannot delete an already booked slot');
  }

  bookableSlots.splice(index, 1);
  return sendResponse(res, 200, true, null, 'Slot deleted successfully');
});

// -------------------------------------------------------------
// BOOKING REQUESTS FLOW MODULE
// -------------------------------------------------------------

// Performer requests booking
app.post('/api/v1/bookings/request', (req: Request, res: Response) => {
  const { slotId, performerId } = req.body;

  if (!slotId || !performerId) {
    return sendResponse(res, 400, false, null, 'Slot ID and Performer ID are required');
  }

  const slotIndex = bookableSlots.findIndex(s => s.id === slotId);
  if (slotIndex === -1) {
    return sendResponse(res, 404, false, null, 'Slot not found');
  }

  const slot = bookableSlots[slotIndex];

  // VALIDATIONS
  if (slot.status === 'Blocked') {
    return sendResponse(res, 400, false, null, 'Cannot book a blocked slot');
  }
  if (slot.status === 'Booked') {
    return sendResponse(res, 400, false, null, 'Cannot book a slot that is already booked');
  }

  // Update slot status
  slot.status = 'Pending';
  slot.performerId = performerId;

  // Create booking request
  const newBooking: Booking = {
    id: `b-${Date.now()}`,
    slotId,
    venueId: slot.venueId,
    performerId,
    date: slot.date,
    startTime: slot.startTime,
    endTime: slot.endTime,
    budget: slot.budget,
    status: 'Pending',
    createdAt: new Date().toISOString()
  };

  bookings.push(newBooking);

  // Send Notification to venue owner
  const venue = venues.find(v => v.id === slot.venueId);
  const perf = performers.find(p => p.id === performerId);
  if (venue) {
    const newNotification: Notification = {
      id: `n-${Date.now()}`,
      userId: venue.organizationId,
      title: 'Booking Request Received',
      message: `${perf?.name || 'A performer'} has requested your slot on ${slot.date} at ${venue.name}.`,
      read: false,
      createdAt: new Date().toISOString()
    };
    notifications.push(newNotification);
  }

  return sendResponse(res, 201, true, newBooking, 'Booking request sent successfully');
});

// Venue Owner Approves
app.post('/api/v1/bookings/:id/approve', (req: Request, res: Response) => {
  const { id } = req.params;
  const bookingIndex = bookings.findIndex(b => b.id === id);

  if (bookingIndex === -1) {
    return sendResponse(res, 404, false, null, 'Booking not found');
  }

  const booking = bookings[bookingIndex];
  if (booking.status !== 'Pending') {
    return sendResponse(res, 400, false, null, `Booking is already ${booking.status.toLowerCase()}`);
  }

  booking.status = 'Confirmed';

  // Update Slot status
  const slot = bookableSlots.find(s => s.id === booking.slotId);
  if (slot) {
    slot.status = 'Booked';
    slot.performerId = booking.performerId;
  }

  // Notify Performer
  const performer = performers.find(p => p.id === booking.performerId);
  const venue = venues.find(v => v.id === booking.venueId);
  if (performer) {
    notifications.push({
      id: `n-${Date.now()}`,
      userId: performer.userId,
      title: 'Booking Approved!',
      message: `Your gig request for ${venue?.name} on ${booking.date} has been approved!`,
      read: false,
      createdAt: new Date().toISOString()
    });
  }

  return sendResponse(res, 200, true, booking, 'Booking approved successfully');
});

// Venue Owner Rejects
app.post('/api/v1/bookings/:id/reject', (req: Request, res: Response) => {
  const { id } = req.params;
  const bookingIndex = bookings.findIndex(b => b.id === id);

  if (bookingIndex === -1) {
    return sendResponse(res, 404, false, null, 'Booking not found');
  }

  const booking = bookings[bookingIndex];
  if (booking.status !== 'Pending') {
    return sendResponse(res, 400, false, null, `Booking is already ${booking.status.toLowerCase()}`);
  }

  booking.status = 'Rejected';

  // Return slot back to Available status
  const slot = bookableSlots.find(s => s.id === booking.slotId);
  if (slot) {
    slot.status = 'Available';
    slot.performerId = null;
  }

  // Notify Performer
  const performer = performers.find(p => p.id === booking.performerId);
  const venue = venues.find(v => v.id === booking.venueId);
  if (performer) {
    notifications.push({
      id: `n-${Date.now()}`,
      userId: performer.userId,
      title: 'Booking Declined',
      message: `Your booking request for ${venue?.name} on ${booking.date} was declined.`,
      read: false,
      createdAt: new Date().toISOString()
    });
  }

  return sendResponse(res, 200, true, booking, 'Booking rejected successfully');
});

// -------------------------------------------------------------
// PERFORMER MODULE
// -------------------------------------------------------------
app.get('/api/v1/performers', (req: Request, res: Response) => {
  return sendResponse(res, 200, true, performers, 'Performers retrieved successfully');
});

app.get('/api/v1/performers/:id', (req: Request, res: Response) => {
  const perf = performers.find(p => p.id === req.params.id);
  if (!perf) return sendResponse(res, 404, false, null, 'Performer profile not found');
  return sendResponse(res, 200, true, perf, 'Performer profile retrieved successfully');
});

app.put('/api/v1/performers/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = performers.findIndex(p => p.id === id);

  if (index === -1) {
    return sendResponse(res, 404, false, null, 'Performer profile not found');
  }

  // Auto calculate profile completion
  const body = req.body;
  let filledFields = 0;
  const fields = ['biography', 'genres', 'pricing', 'languages', 'experience', 'travelRadius', 'equipmentNeeded', 'imageUrl'];
  fields.forEach(f => {
    const val = body[f] !== undefined ? body[f] : performers[index][f as keyof Performer];
    if (Array.isArray(val) && val.length > 0) filledFields++;
    else if (val && !Array.isArray(val)) filledFields++;
  });

  const completionPercentage = Math.round((filledFields / fields.length) * 100);

  const updatedPerformer = {
    ...performers[index],
    ...body,
    completionPercentage,
    id // keep original ID
  };

  performers[index] = updatedPerformer;
  return sendResponse(res, 200, true, updatedPerformer, 'Performer profile updated successfully');
});

// -------------------------------------------------------------
// MESSAGES MODULE
// -------------------------------------------------------------
app.get('/api/v1/messages', (req: Request, res: Response) => {
  const { userId, otherUserId } = req.query;

  if (!userId) {
    return sendResponse(res, 400, false, null, 'User ID is required');
  }

  let filtered = messages;
  if (otherUserId) {
    filtered = messages.filter(m =>
      (m.senderId === userId && m.receiverId === otherUserId) ||
      (m.senderId === otherUserId && m.receiverId === userId)
    );
  } else {
    // Get chat summary (who has sent/received messages to/from user)
    filtered = messages.filter(m => m.senderId === userId || m.receiverId === userId);
  }

  // Sort chronologically
  filtered.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return sendResponse(res, 200, true, filtered, 'Messages retrieved');
});

app.post('/api/v1/messages', (req: Request, res: Response) => {
  const { senderId, receiverId, content } = req.body;

  if (!senderId || !receiverId || !content) {
    return sendResponse(res, 400, false, null, 'Sender ID, Receiver ID, and Content are required');
  }

  const newMessage: Message = {
    id: `msg-${Date.now()}`,
    senderId,
    receiverId,
    content,
    timestamp: new Date().toISOString()
  };

  messages.push(newMessage);
  return sendResponse(res, 201, true, newMessage, 'Message sent');
});

// -------------------------------------------------------------
// NOTIFICATIONS MODULE
// -------------------------------------------------------------
app.get('/api/v1/notifications', (req: Request, res: Response) => {
  const { userId } = req.query;
  if (!userId) {
    return sendResponse(res, 400, false, null, 'User ID is required');
  }
  const filtered = notifications.filter(n => n.userId === userId);
  // Sort newest first
  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return sendResponse(res, 200, true, filtered, 'Notifications retrieved');
});

app.post('/api/v1/notifications/:id/read', (req: Request, res: Response) => {
  const { id } = req.params;
  const notif = notifications.find(n => n.id === id);
  if (!notif) return sendResponse(res, 404, false, null, 'Notification not found');
  notif.read = true;
  return sendResponse(res, 200, true, notif, 'Notification marked as read');
});

// -------------------------------------------------------------
// REVIEWS MODULE
// -------------------------------------------------------------
app.get('/api/v1/reviews', (req: Request, res: Response) => {
  const { revieweeId } = req.query;
  let filtered = reviews;
  if (revieweeId) {
    filtered = reviews.filter(r => r.revieweeId === revieweeId);
  }
  return sendResponse(res, 200, true, filtered, 'Reviews retrieved');
});

app.post('/api/v1/reviews', (req: Request, res: Response) => {
  const { bookingId, reviewerId, revieweeId, rating, comment } = req.body;

  if (!bookingId || !reviewerId || !revieweeId || rating === undefined || !comment) {
    return sendResponse(res, 400, false, null, 'Missing review properties');
  }

  const booking = bookings.find(b => b.id === bookingId);
  if (!booking) {
    return sendResponse(res, 404, false, null, 'Booking not found');
  }

  // VALIDATION: Cannot review unfinished booking
  // For MVP, we can assume if the date of booking is today or in the past, it's finishable.
  const todayStr = new Date().toISOString().split('T')[0];
  if (booking.date > todayStr) {
    return sendResponse(res, 400, false, null, 'Cannot review a future gig booking');
  }

  const newReview: Review = {
    id: `r-${Date.now()}`,
    bookingId,
    reviewerId,
    revieweeId,
    rating: Number(rating),
    comment,
    createdAt: new Date().toISOString()
  };

  reviews.push(newReview);
  return sendResponse(res, 201, true, newReview, 'Review submitted successfully');
});

// -------------------------------------------------------------
// BOOKING LIST FOR BOTH ROLES
// -------------------------------------------------------------
app.get('/api/v1/bookings', (req: Request, res: Response) => {
  const { performerId, organizationId } = req.query;
  let filtered = bookings;

  if (performerId) {
    filtered = bookings.filter(b => b.performerId === performerId);
  } else if (organizationId) {
    filtered = bookings.filter(b => b.venueId && venues.find(v => v.id === b.venueId && v.organizationId === organizationId));
  }

  // Populate detailed venue and performer profiles for listings
  const detailedBookings = filtered.map(b => {
    const venue = venues.find(v => v.id === b.venueId);
    const performer = performers.find(p => p.id === b.performerId);
    return {
      ...b,
      venue,
      performer
    };
  });

  return sendResponse(res, 200, true, detailedBookings, 'Bookings retrieved successfully');
});

// -------------------------------------------------------------
// VOICE AI MODULE
// -------------------------------------------------------------
app.use('/api/v1/voice', webhookRoutes);

app.post('/api/v1/voice/provision', async (req: Request, res: Response) => {
  const { orgId, industry } = req.body;
  if (!orgId || !industry) return sendResponse(res, 400, false, null, 'orgId and industry required');
  try {
    const assistant = await provisionAssistant(orgId, industry);
    return sendResponse(res, 200, true, assistant, 'Assistant provisioned');
  } catch (error: any) {
    return sendResponse(res, 500, false, null, error.message);
  }
});

app.get('/api/v1/voice/assistant', (req: Request, res: Response) => {
  const { orgId } = req.query;
  const assistant = voiceAssistants.find(a => a.organizationId === orgId);
  return sendResponse(res, 200, true, assistant || null, 'Assistant retrieved');
});

app.get('/api/v1/voice/calls', async (req: Request, res: Response) => {
  const { orgId } = req.query;
  const assistant = voiceAssistants.find(a => a.organizationId === orgId);
  if (!assistant || !assistant.vapiAssistantId) return sendResponse(res, 200, true, [], 'No calls');
  try {
    const config = getConfig();
    if (!config.vapiApiKey) return sendResponse(res, 200, true, [], 'VAPI_API_KEY missing, showing no calls');
    const calls = await getCalls({ assistantId: assistant.vapiAssistantId, limit: 50 }, config.vapiApiKey);
    return sendResponse(res, 200, true, calls, 'Calls retrieved');
  } catch (error: any) {
    return sendResponse(res, 500, false, null, error.message);
  }
});

app.get('/api/v1/voice/industries', (req: Request, res: Response) => {
  return sendResponse(res, 200, true, industryTemplates, 'Industries retrieved');
});

// -------------------------------------------------------------
// SYSTEM STATUS / HEARTBEAT
// -------------------------------------------------------------
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// Start Server
app.listen(PORT, () => {
  console.log(`[StageHub Mock Backend] running on http://localhost:${PORT}`);
});
