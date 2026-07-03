import { PrismaClient } from '@prisma/client';
import {
  users,
  venues,
  bookableSlots,
  performers,
  bookings,
  reviews,
  notifications,
  messages,
  voiceAssistants,
  voiceCallLogs
} from './store';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed (bulk mode)...');

  // 1. Users
  console.log('Inserting users...');
  await prisma.user.createMany({
    data: users.map(user => ({
      id: user.id,
      email: user.email,
      passwordHash: user.password || 'password123',
      role: user.role.toUpperCase() as any,
      name: user.name,
      isManager: user.isManager || false,
      parentOrgId: user.parentOrgId || null,
      createdAt: new Date(),
      updatedAt: new Date()
    })),
    skipDuplicates: true
  });
  console.log(`Seeded ${users.length} users.`);

  // 2. Organizations
  console.log('Inserting organizations...');
  const orgsToCreate = users
    .filter(user => user.role === 'organization' && !user.isManager)
    .map(user => ({
      id: user.id,
      userId: user.id,
      name: user.name,
      state: user.state || null,
      city: user.city || null,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
  
  await prisma.organization.createMany({
    data: orgsToCreate,
    skipDuplicates: true
  });
  console.log(`Seeded ${orgsToCreate.length} organizations.`);

  // 3. Venues & VenueManagers
  console.log('Inserting venues and managers...');
  await prisma.venue.createMany({
    data: venues.map(venue => ({
      id: venue.id,
      organizationId: venue.organizationId,
      name: venue.name,
      address: venue.address,
      description: venue.description || null,
      capacity: venue.capacity,
      type: venue.type,
      equipment: venue.equipment || [],
      policies: venue.policies || [],
      imageUrl: venue.imageUrl || null,
      createdAt: new Date(),
      updatedAt: new Date()
    })),
    skipDuplicates: true
  });

  const venueManagersToCreate: any[] = [];
  venues.forEach(venue => {
    if (venue.managerIds && venue.managerIds.length > 0) {
      venue.managerIds.forEach(managerId => {
        venueManagersToCreate.push({
          userId: managerId,
          venueId: venue.id
        });
      });
    }
  });

  if (venueManagersToCreate.length > 0) {
    await prisma.venueManager.createMany({
      data: venueManagersToCreate,
      skipDuplicates: true
    });
  }
  console.log(`Seeded ${venues.length} venues and ${venueManagersToCreate.length} managers.`);

  // 4. Performers
  console.log('Inserting performers...');
  await prisma.performer.createMany({
    data: performers.map(performer => ({
      id: performer.id,
      userId: performer.userId,
      name: performer.name,
      biography: performer.biography || null,
      genres: performer.genres || [],
      pricing: performer.pricing,
      languages: performer.languages || [],
      experience: performer.experience || null,
      travelRadius: performer.travelRadius || 10,
      equipmentNeeded: performer.equipmentNeeded || [],
      imageUrl: performer.imageUrl || null,
      completionPercentage: performer.completionPercentage || 0,
      state: performer.state || null,
      city: performer.city || null,
      createdAt: new Date(),
      updatedAt: new Date()
    })),
    skipDuplicates: true
  });
  console.log(`Seeded ${performers.length} performers.`);

  // 5. BookableSlots
  console.log('Inserting bookable slots...');
  
  // Collect all slot IDs we will create
  const existingSlotIds = new Set(bookableSlots.map(s => s.id));
  const slotsToCreate = bookableSlots.map(slot => ({
    id: slot.id,
    venueId: slot.venueId,
    date: slot.date,
    startTime: slot.startTime,
    endTime: slot.endTime,
    budget: slot.budget,
    status: slot.status.toUpperCase() as any,
    performerId: slot.performerId || null,
    createdAt: new Date(),
    updatedAt: new Date()
  }));

  // Check bookings for missing slots and add dummy slots to insert list if missing
  const dummySlotsToCreate: any[] = [];
  const dummyCreatedIds = new Set<string>();

  bookings.forEach(booking => {
    if (!existingSlotIds.has(booking.slotId) && !dummyCreatedIds.has(booking.slotId)) {
      dummySlotsToCreate.push({
        id: booking.slotId,
        venueId: booking.venueId,
        date: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime,
        budget: booking.budget,
        status: 'BOOKED',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      dummyCreatedIds.add(booking.slotId);
    }
  });

  // Combine and create all slots
  const allSlotsToCreate = [...slotsToCreate, ...dummySlotsToCreate];
  await prisma.bookableSlot.createMany({
    data: allSlotsToCreate,
    skipDuplicates: true
  });
  console.log(`Seeded ${allSlotsToCreate.length} bookable slots (including ${dummySlotsToCreate.length} fallback slots).`);

  // 6. Bookings
  console.log('Inserting bookings...');
  await prisma.booking.createMany({
    data: bookings.map(booking => ({
      id: booking.id,
      slotId: booking.slotId,
      venueId: booking.venueId,
      performerId: booking.performerId,
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
      budget: booking.budget,
      status: booking.status.toUpperCase() as any,
      createdAt: new Date(booking.createdAt),
      updatedAt: new Date()
    })),
    skipDuplicates: true
  });
  console.log(`Seeded ${bookings.length} bookings.`);

  // 7. Reviews
  console.log('Inserting reviews...');
  await prisma.review.createMany({
    data: reviews.map(review => ({
      id: review.id,
      bookingId: review.bookingId,
      reviewerId: review.reviewerId,
      revieweeId: review.revieweeId,
      rating: review.rating,
      comment: review.comment,
      createdAt: new Date(review.createdAt),
      updatedAt: new Date()
    })),
    skipDuplicates: true
  });
  console.log(`Seeded ${reviews.length} reviews.`);

  // 8. Notifications
  console.log('Inserting notifications...');
  await prisma.notification.createMany({
    data: notifications.map(notification => ({
      id: notification.id,
      userId: notification.userId,
      title: notification.title,
      message: notification.message,
      read: notification.read,
      createdAt: new Date(notification.createdAt),
      updatedAt: new Date()
    })),
    skipDuplicates: true
  });
  console.log(`Seeded ${notifications.length} notifications.`);

  // 9. Messages
  console.log('Inserting messages...');
  await prisma.message.createMany({
    data: messages.map(message => ({
      id: message.id,
      senderId: message.senderId,
      receiverId: message.receiverId,
      content: message.content,
      timestamp: new Date(message.timestamp)
    })),
    skipDuplicates: true
  });
  console.log(`Seeded ${messages.length} messages.`);

  // 10. VoiceAssistants
  if (voiceAssistants.length > 0) {
    console.log('Inserting voice assistants...');
    await prisma.voiceAssistant.createMany({
      data: voiceAssistants.map(assistant => ({
        id: assistant.id,
        organizationId: assistant.organizationId,
        vapiAssistantId: assistant.vapiAssistantId,
        name: assistant.name,
        industry: assistant.industry,
        status: assistant.status,
        errorMessage: assistant.errorMessage,
        config: assistant.config || null,
        lastSyncedAt: assistant.lastSyncedAt ? new Date(assistant.lastSyncedAt) : null,
        createdAt: new Date(assistant.createdAt)
      })),
      skipDuplicates: true
    });
  }
  console.log(`Seeded ${voiceAssistants.length} voice assistants.`);

  // 11. VoiceCallLogs
  if (voiceCallLogs.length > 0) {
    console.log('Inserting voice call logs...');
    await prisma.voiceCallLog.createMany({
      data: voiceCallLogs.map(log => ({
        id: log.id,
        assistantId: log.assistantId,
        vapiCallId: log.vapiCallId,
        type: log.type,
        startedAt: new Date(log.startedAt),
        endedAt: new Date(log.endedAt),
        duration: log.duration,
        cost: log.cost,
        status: log.status,
        transcript: log.transcript,
        summary: log.summary
      })),
      skipDuplicates: true
    });
  }
  console.log(`Seeded ${voiceCallLogs.length} voice call logs.`);

  console.log('Seeding complete successfully.');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
