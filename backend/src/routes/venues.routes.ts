import { Router } from 'express';
import { getVenues, createVenue, updateVenue, deleteVenue } from '../controllers/venues.controller';
import { requireAuth, requireRole } from '../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * /api/v1/venues:
 *   get:
 *     summary: Get all venues
 *     tags: [Venues]
 *     parameters:
 *       - in: query
 *         name: organizationId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of venues
 *   post:
 *     summary: Create a venue
 *     tags: [Venues]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               organizationId:
 *                 type: string
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *               capacity:
 *                 type: number
 *               type:
 *                 type: string
 *     responses:
 *       201:
 *         description: Venue created
 */
router.get('/', requireAuth, getVenues);
router.post('/', requireAuth, requireRole(['ORGANIZATION']), createVenue);

/**
 * @swagger
 * /api/v1/venues/{id}:
 *   put:
 *     summary: Update a venue
 *     tags: [Venues]
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
 *         description: Venue updated
 *   delete:
 *     summary: Delete a venue
 *     tags: [Venues]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Venue deleted
 */
router.put('/:id', requireAuth, requireRole(['ORGANIZATION']), updateVenue);
router.delete('/:id', requireAuth, requireRole(['ORGANIZATION']), deleteVenue);

export default router;
