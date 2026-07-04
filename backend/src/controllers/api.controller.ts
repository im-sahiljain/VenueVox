import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import crypto from 'crypto';
import axios from 'axios';

// Slots
export const getSlots = async (req: Request, res: Response) => {
  try {
    const venueId = req.query.venueId as string;
    const slots = await prisma.bookableSlot.findMany({
      where: venueId ? { venueId } : undefined,
      include: {
        venue: true,
        performer: true,
        bookings: {
          include: { performer: true }
        }
      }
    });
    return res.status(200).json({ success: true, data: slots, message: 'Slots retrieved' });
  } catch (error: any) {
    return res.status(500).json({ success: false, data: null, message: 'Server error' });
  }
};

export const getDiscoverSlots = async (req: Request, res: Response) => {
  try {
    const { location, date, budget, venueType, equipment, state, city } = req.query;
    const where: any = {
      status: 'AVAILABLE'
    };

    if (date) {
      where.date = date as string;
    }
    if (budget) {
      where.budget = {
        lte: parseFloat(budget as string)
      };
    }

    const venueFilter: any = {};
    if (venueType && venueType !== 'All') {
      venueFilter.type = venueType as string;
    }
    if (location) {
      venueFilter.address = {
        contains: location as string,
        mode: 'insensitive'
      };
    }
    if (equipment && equipment !== 'All') {
      venueFilter.equipment = {
        has: equipment as string
      };
    }

    const orgFilter: any = {};
    if (state && state !== 'All') {
      orgFilter.state = state as string;
    }
    if (city && city !== 'All') {
      orgFilter.city = city as string;
    }

    if (Object.keys(orgFilter).length > 0) {
      venueFilter.organization = orgFilter;
    }
    if (Object.keys(venueFilter).length > 0) {
      where.venue = venueFilter;
    }

    const slots = await prisma.bookableSlot.findMany({
      where,
      include: {
        venue: {
          include: {
            organization: true
          }
        }
      }
    });

    const formattedSlots = slots.map((s: any) => {
      const hasVoiceAssistant = false;
      return {
        ...s,
        venue: s.venue ? {
          ...s.venue,
          hasVoiceAssistant
        } : null,
        organization: s.venue?.organization ? {
          id: s.venue.organization.id,
          name: s.venue.organization.name,
          state: s.venue.organization.state,
          city: s.venue.organization.city
        } : null
      };
    });

    return res.status(200).json({ success: true, data: formattedSlots, message: 'Discover slots retrieved successfully' });
  } catch (error: any) {
    return res.status(500).json({ success: false, data: null, message: 'Server error', errors: [error.message] });
  }
};

export const createSlot = async (req: Request, res: Response) => {
  try {
    const slot = await prisma.bookableSlot.create({
      data: req.body
    });
    return res.status(201).json({ success: true, data: slot, message: 'Slot created' });
  } catch (error: any) {
    return res.status(500).json({ success: false, data: null, message: 'Server error' });
  }
};

export const updateSlot = async (req: Request, res: Response) => {
  try {
    const slot = await prisma.bookableSlot.update({
      where: { id: req.params.id },
      data: req.body
    });
    return res.status(200).json({ success: true, data: slot, message: 'Slot updated' });
  } catch (error: any) {
    return res.status(500).json({ success: false, data: null, message: 'Server error' });
  }
};

export const deleteSlot = async (req: Request, res: Response) => {
  try {
    await prisma.bookableSlot.delete({ where: { id: req.params.id } });
    return res.status(200).json({ success: true, data: null, message: 'Slot deleted' });
  } catch (error: any) {
    return res.status(500).json({ success: false, data: null, message: 'Server error' });
  }
};

// Bookings
export const requestBooking = async (req: Request, res: Response) => {
  try {
    const { slotId, performerId, date, startTime, endTime, budget, venueId } = req.body;
    const booking = await prisma.booking.create({
      data: {
        slotId,
        performerId,
        date,
        startTime,
        endTime,
        budget,
        venueId,
        status: 'PENDING'
      },
      include: {
        performer: true,
        venue: true
      }
    });
    
    // Update slot status to PENDING
    await prisma.bookableSlot.update({
      where: { id: slotId },
      data: { status: 'PENDING' }
    });

    // Create notifications for the venue hosts
    const notificationsToCreate: string[] = [];
    
    // Find organization owner
    if (booking.venue) {
      const org = await prisma.organization.findUnique({
        where: { id: booking.venue.organizationId }
      });
      if (org?.userId) {
        notificationsToCreate.push(org.userId);
      }
    }
    
    // Find venue managers
    const managers = await prisma.venueManager.findMany({
      where: { venueId }
    });
    for (const m of managers) {
      if (!notificationsToCreate.includes(m.userId)) {
        notificationsToCreate.push(m.userId);
      }
    }
    
    // Create database notifications
    const performerName = booking.performer?.name || 'A performer';
    for (const targetUserId of notificationsToCreate) {
      await prisma.notification.create({
        data: {
          userId: targetUserId,
          title: 'New Booking Request',
          message: `Booking request from ${performerName} at ${booking.venue?.name} on ${date} (${startTime}-${endTime}).`,
          read: false,
        }
      });
    }
    
    return res.status(201).json({ success: true, data: booking, message: 'Booking requested' });
  } catch (error: any) {
    return res.status(500).json({ success: false, data: null, message: 'Server error', errors: [error.message] });
  }
};

export const approveBooking = async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    
    // Find booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { performer: true, venue: true }
    });
    
    if (!booking) {
      return res.status(404).json({ success: false, data: null, message: 'Booking not found' });
    }
    
    // Update booking status
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'CONFIRMED' }
    });
    
    // Update slot status
    await prisma.bookableSlot.update({
      where: { id: booking.slotId },
      data: { status: 'BOOKED', performerId: booking.performerId }
    });
    
    // Notify the performer
    if (booking.performer?.userId) {
      await prisma.notification.create({
        data: {
          userId: booking.performer.userId,
          title: 'Booking Confirmed!',
          message: `Your booking request at ${booking.venue.name} on ${booking.date} (${booking.startTime}-${booking.endTime}) has been approved!`,
          read: false
        }
      });
    }
    
    return res.status(200).json({ success: true, data: updatedBooking, message: 'Booking approved successfully' });
  } catch (error: any) {
    return res.status(500).json({ success: false, data: null, message: 'Server error', errors: [error.message] });
  }
};

export const rejectBooking = async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    
    // Find booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { performer: true, venue: true }
    });
    
    if (!booking) {
      return res.status(404).json({ success: false, data: null, message: 'Booking not found' });
    }
    
    // Update booking status
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'REJECTED' }
    });
    
    // Update slot status to AVAILABLE
    await prisma.bookableSlot.update({
      where: { id: booking.slotId },
      data: { status: 'AVAILABLE', performerId: null }
    });
    
    // Notify the performer
    if (booking.performer?.userId) {
      await prisma.notification.create({
        data: {
          userId: booking.performer.userId,
          title: 'Booking Declined',
          message: `Your booking request at ${booking.venue.name} on ${booking.date} (${booking.startTime}-${booking.endTime}) has been declined.`,
          read: false
        }
      });
    }
    
    return res.status(200).json({ success: true, data: updatedBooking, message: 'Booking rejected successfully' });
  } catch (error: any) {
    return res.status(500).json({ success: false, data: null, message: 'Server error', errors: [error.message] });
  }
};

export const getBookings = async (req: Request, res: Response) => {
  try {
    const { venueId, performerId, status, organizationId } = req.query;
    const where: any = {};
    if (venueId) where.venueId = venueId;
    if (performerId) where.performerId = performerId;
    if (status) where.status = (status as string).toUpperCase();
    if (organizationId) {
      where.venue = {
        organizationId: organizationId as string
      };
    }
    
    const bookingsList = await prisma.booking.findMany({
      where,
      include: {
        venue: true,
        performer: {
          include: { user: true }
        },
        slot: true
      }
    });
    return res.status(200).json({ success: true, data: bookingsList, message: 'Bookings retrieved' });
  } catch (error: any) {
    return res.status(500).json({ success: false, data: null, message: 'Server error' });
  }
};

// Performers
export const getPerformers = async (req: Request, res: Response) => {
  try {
    const { state, city } = req.query;
    const where: any = {};
    
    if (state && state !== 'All') {
      where.state = state as string;
    }
    if (city && city !== 'All') {
      where.city = city as string;
    }

    const performersList = await prisma.performer.findMany({
      where,
      include: { user: true }
    });
    return res.status(200).json({ success: true, data: performersList, message: 'Performers retrieved' });
  } catch (error: any) {
    return res.status(500).json({ success: false, data: null, message: 'Server error' });
  }
};

export const getPerformerById = async (req: Request, res: Response) => {
  try {
    const performer = await prisma.performer.findUnique({
      where: { id: req.params.id },
      include: { user: true }
    });
    return res.status(200).json({ success: true, data: performer, message: 'Performer retrieved' });
  } catch (error: any) {
    return res.status(500).json({ success: false, data: null, message: 'Server error' });
  }
};

// Messages
export const getMessages = async (req: Request, res: Response) => {
  try {
    const { userId, otherUserId } = req.query;
    if (!userId) {
      return res.status(400).json({ success: false, data: null, message: 'userId is required' });
    }

    let whereClause: any;
    if (otherUserId) {
      whereClause = {
        OR: [
          { senderId: userId as string, receiverId: otherUserId as string },
          { senderId: otherUserId as string, receiverId: userId as string }
        ]
      };
    } else {
      whereClause = {
        OR: [
          { senderId: userId as string },
          { receiverId: userId as string }
        ]
      };
    }

    const messagesList = await prisma.message.findMany({
      where: whereClause,
      orderBy: { timestamp: 'asc' }
    });
    return res.status(200).json({ success: true, data: messagesList, message: 'Messages retrieved' });
  } catch (error: any) {
    return res.status(500).json({ success: false, data: null, message: 'Server error' });
  }
};

export const createMessage = async (req: Request, res: Response) => {
  try {
    const { senderId, receiverId, content } = req.body;
    if (!senderId || !receiverId || !content) {
      return res.status(400).json({ success: false, data: null, message: 'senderId, receiverId, and content are required' });
    }

    const newMessage = await prisma.message.create({
      data: {
        senderId,
        receiverId,
        content,
      }
    });

    return res.status(201).json({ success: true, data: newMessage, message: 'Message sent successfully' });
  } catch (error: any) {
    return res.status(500).json({ success: false, data: null, message: 'Server error', errors: [error.message] });
  }
};

// Notifications
export const getNotifications = async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    const notes = await prisma.notification.findMany({
      where: userId ? { userId: userId as string } : undefined,
      orderBy: { createdAt: 'desc' }
    });
    return res.status(200).json({ success: true, data: notes, message: 'Notifications retrieved' });
  } catch (error: any) {
    return res.status(500).json({ success: false, data: null, message: 'Server error' });
  }
};

// Organizations (Managers)
export const getManagers = async (req: Request, res: Response) => {
  try {
    const { orgId } = req.params;
    // In our simplified schema, users linked to org are managers
    const managers = await prisma.user.findMany({
      where: { parentOrgId: orgId, isManager: true }
    });
    return res.status(200).json({ success: true, data: managers, message: 'Managers retrieved' });
  } catch (error: any) {
    return res.status(500).json({ success: false, data: null, message: 'Server error' });
  }
};

export const createManager = async (req: Request, res: Response) => {
  try {
    const { orgId } = req.params;
    const manager = await prisma.user.create({
      data: { ...req.body, parentOrgId: orgId, isManager: true, role: 'ORGANIZATION' }
    });
    return res.status(201).json({ success: true, data: manager, message: 'Manager created' });
  } catch (error: any) {
    return res.status(500).json({ success: false, data: null, message: 'Server error' });
  }
};

// Reviews
export const getReviews = async (req: Request, res: Response) => {
  try {
    const { revieweeId, bookingId } = req.query;
    const where: any = {};
    if (revieweeId) where.revieweeId = revieweeId;
    if (bookingId) where.bookingId = bookingId;
    const reviewList = await prisma.review.findMany({ where });
    return res.status(200).json({ success: true, data: reviewList, message: 'Reviews retrieved' });
  } catch (error: any) {
    return res.status(500).json({ success: false, data: null, message: 'Server error' });
  }
};

export const createReview = async (req: Request, res: Response) => {
  try {
    const review = await prisma.review.create({ data: req.body });
    return res.status(201).json({ success: true, data: review, message: 'Review created' });
  } catch (error: any) {
    return res.status(500).json({ success: false, data: null, message: 'Server error' });
  }
};

export const updatePerformer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const body = req.body;
    
    const existing = await prisma.performer.findUnique({
      where: { id }
    });
    
    if (!existing) {
      return res.status(404).json({ success: false, data: null, message: 'Performer profile not found' });
    }
    
    let filledFields = 0;
    const fields = ['biography', 'genres', 'pricing', 'languages', 'experience', 'travelRadius', 'equipmentNeeded', 'imageUrl'];
    fields.forEach(f => {
      const val = body[f] !== undefined ? body[f] : (existing as any)[f];
      if (Array.isArray(val) && val.length > 0) filledFields++;
      else if (val && !Array.isArray(val)) filledFields++;
    });
    
    const completionPercentage = Math.round((filledFields / fields.length) * 100);
    
    const updated = await prisma.performer.update({
      where: { id },
      data: {
        name: body.name,
        biography: body.biography,
        genres: body.genres,
        pricing: body.pricing ? parseFloat(body.pricing) : undefined,
        languages: body.languages,
        experience: body.experience,
        travelRadius: body.travelRadius ? parseInt(body.travelRadius) : undefined,
              equipmentNeeded: body.equipmentNeeded,
        imageUrl: body.imageUrl,
        photos: body.photos,
        completionPercentage
      }
    });
    
    return res.status(200).json({
      success: true,
      data: updated,
      message: 'Performer profile updated successfully'
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, data: null, message: 'Server error', errors: [error.message] });
  }
};

export const deleteMedia = async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, message: 'URL is required' });
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      console.warn('Cloudinary credentials missing in backend environment');
      return res.status(200).json({ success: true, message: 'Skipped Cloudinary deletion (credentials missing)' });
    }

    if (!url.includes(`res.cloudinary.com/${cloudName}`)) {
      return res.status(200).json({ success: true, message: 'Not a Cloudinary URL, skipped Cloudinary deletion' });
    }

    const parts = url.split('/image/upload/');
    if (parts.length < 2) {
      return res.status(400).json({ success: false, message: 'Invalid Cloudinary URL structure' });
    }
    const pathPart = parts[1];
    const subparts = pathPart.split('/');
    if (subparts[0].match(/^v\d+$/)) {
      subparts.shift();
    }
    const relativePathWithExt = subparts.join('/');
    const lastDotIdx = relativePathWithExt.lastIndexOf('.');
    const publicId = lastDotIdx === -1 ? relativePathWithExt : relativePathWithExt.substring(0, lastDotIdx);

    const timestamp = Math.round(new Date().getTime() / 1000);
    const signatureStr = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash('sha1').update(signatureStr).digest('hex');

    const formData = new URLSearchParams();
    formData.append('public_id', publicId);
    formData.append('timestamp', String(timestamp));
    formData.append('api_key', apiKey);
    formData.append('signature', signature);

    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`;
    const response = await axios.post(cloudinaryUrl, formData.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    if (response.data && response.data.result === 'ok') {
      console.log(`Successfully deleted asset ${publicId} from Cloudinary`);
      return res.status(200).json({ success: true, message: 'Successfully deleted from Cloudinary' });
    } else {
      console.log('Cloudinary destroy response:', response.data);
      return res.status(200).json({ success: true, message: `Cloudinary destroy returned: ${response.data.result || 'unknown error'} (tolerated)` });
    }
  } catch (error: any) {
    console.error('Error destroying Cloudinary asset:', error.message);
    return res.status(200).json({ success: true, message: 'Tolerated backend error deleting from Cloudinary', error: error.message });
  }
};

export const uploadMedia = async (req: Request, res: Response) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const folder = (req.body.folder as string) || 'VenueVox';

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return res.status(550).json({
        success: false,
        message: 'Cloudinary credentials missing in backend environment',
      });
    }

    const timestamp = Math.round(new Date().getTime() / 1000);
    
    // Sort and sign the parameters: folder and timestamp
    const signatureStr = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash('sha1').update(signatureStr).digest('hex');

    const fileBase64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

    const formData = new URLSearchParams();
    formData.append('file', fileBase64);
    formData.append('folder', folder);
    formData.append('timestamp', String(timestamp));
    formData.append('api_key', apiKey);
    formData.append('signature', signature);

    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    const response = await axios.post(cloudinaryUrl, formData.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    if (response.data && response.data.secure_url) {
      return res.status(200).json({
        success: true,
        data: response.data.secure_url,
        message: 'Image uploaded successfully',
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to upload to Cloudinary',
        errors: [response.data],
      });
    }
  } catch (error: any) {
    console.error('Error uploading to Cloudinary:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error uploading to Cloudinary',
      errors: [error.message],
    });
  }
};

