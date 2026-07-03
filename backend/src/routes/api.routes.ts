import { Router } from 'express';
import { 
  getSlots, getDiscoverSlots, createSlot, updateSlot, deleteSlot,
  requestBooking, getBookings, approveBooking, rejectBooking,
  getPerformers, getPerformerById, updatePerformer,
  getMessages, createMessage, getNotifications,
  getManagers, createManager,
  getReviews, createReview, deleteMedia
} from '../controllers/api.controller';

const router = Router();

/**
 * @swagger
 * /api/v1/slots:
 *   get:
 *     summary: Get all slots (optional filtering by venueId)
 *     tags: [Slots]
 *     parameters:
 *       - in: query
 *         name: venueId
 *         schema:
 *           type: string
 *         description: Filter slots by venue ID
 *     responses:
 *       200:
 *         description: List of slots retrieved successfully
 *   post:
 *     summary: Create a bookable slot
 *     tags: [Slots]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - venueId
 *               - date
 *               - startTime
 *               - endTime
 *               - budget
 *             properties:
 *               venueId:
 *                 type: string
 *               date:
 *                 type: string
 *                 example: "2026-07-15"
 *               startTime:
 *                 type: string
 *                 example: "18:00"
 *               endTime:
 *                 type: string
 *                 example: "21:00"
 *               budget:
 *                 type: number
 *                 example: 1500
 *     responses:
 *       201:
 *         description: Slot created successfully
 */
router.get('/slots', getSlots);
router.post('/slots', createSlot);

/**
 * @swagger
 * /api/v1/slots/discover:
 *   get:
 *     summary: Get all available slots for discovery
 *     tags: [Slots]
 *     responses:
 *       200:
 *         description: Available slots retrieved successfully
 */
router.get('/slots/discover', getDiscoverSlots);

/**
 * @swagger
 * /api/v1/slots/{id}:
 *   put:
 *     summary: Update a bookable slot
 *     tags: [Slots]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Slot updated successfully
 *   delete:
 *     summary: Delete a bookable slot
 *     tags: [Slots]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Slot deleted successfully
 */
router.put('/slots/:id', updateSlot);
router.delete('/slots/:id', deleteSlot);

/**
 * @swagger
 * /api/v1/bookings:
 *   get:
 *     summary: Get all bookings
 *     tags: [Bookings]
 *     parameters:
 *       - in: query
 *         name: venueId
 *         schema:
 *           type: string
 *       - in: query
 *         name: performerId
 *         schema:
 *           type: string
 *       - in: query
 *         name: organizationId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, CONFIRMED, REJECTED, CANCELLED]
 *     responses:
 *       200:
 *         description: Bookings retrieved successfully
 */
router.get('/bookings', getBookings);

/**
 * @swagger
 * /api/v1/bookings/request:
 *   post:
 *     summary: Request a booking for a slot
 *     tags: [Bookings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - slotId
 *               - performerId
 *               - date
 *               - startTime
 *               - endTime
 *               - budget
 *               - venueId
 *             properties:
 *               slotId:
 *                 type: string
 *               performerId:
 *                 type: string
 *               date:
 *                 type: string
 *               startTime:
 *                 type: string
 *               endTime:
 *                 type: string
 *               budget:
 *                 type: number
 *               venueId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Booking request created successfully
 */
router.post('/bookings/request', requestBooking);
router.post('/bookings/:bookingId/approve', approveBooking);
router.post('/bookings/:bookingId/reject', rejectBooking);

/**
 * @swagger
 * /api/v1/performers:
 *   get:
 *     summary: Get all performers list
 *     tags: [Performers]
 *     responses:
 *       200:
 *         description: List of performers retrieved successfully
 */
router.get('/performers', getPerformers);

/**
 * @swagger
 * /api/v1/performers/{id}:
 *   get:
 *     summary: Get performer profile details by ID
 *     tags: [Performers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Performer details retrieved successfully
 *   put:
 *     summary: Update performer profile details
 *     tags: [Performers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Performer profile updated successfully
 */
router.get('/performers/:id', getPerformerById);
router.put('/performers/:id', updatePerformer);

/**
 * @swagger
 * /api/v1/messages:
 *   get:
 *     summary: Get messages list (optional filtering by userId)
 *     tags: [Messages]
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 */
router.get('/messages', getMessages);
router.post('/messages', createMessage);

/**
 * @swagger
 * /api/v1/notifications:
 *   get:
 *     summary: Get notifications list (optional filtering by userId)
 *     tags: [Notifications]
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 */
router.get('/notifications', getNotifications);

/**
 * @swagger
 * /api/v1/organizations/{orgId}/managers:
 *   get:
 *     summary: Get managers of an organization
 *     tags: [Organizations]
 *     parameters:
 *       - in: path
 *         name: orgId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Managers list retrieved successfully
 *   post:
 *     summary: Add/Create a manager for an organization
 *     tags: [Organizations]
 *     parameters:
 *       - in: path
 *         name: orgId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - passwordHash
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *               passwordHash:
 *                 type: string
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Manager created successfully
 */
router.get('/organizations/:orgId/managers', getManagers);
router.post('/organizations/:orgId/managers', createManager);

/**
 * @swagger
 * /api/v1/reviews:
 *   get:
 *     summary: Get reviews list
 *     tags: [Reviews]
 *     parameters:
 *       - in: query
 *         name: revieweeId
 *         schema:
 *           type: string
 *       - in: query
 *         name: bookingId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Reviews retrieved successfully
 *   post:
 *     summary: Create a review for a booking
 *     tags: [Reviews]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bookingId
 *               - reviewerId
 *               - revieweeId
 *               - rating
 *               - comment
 *             properties:
 *               bookingId:
 *                 type: string
 *               reviewerId:
 *                 type: string
 *               revieweeId:
 *                 type: string
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Review created successfully
 */
router.get('/reviews', getReviews);
router.post('/reviews', createReview);
router.post('/media/delete', deleteMedia);

export default router;
