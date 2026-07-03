import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const getVenues = async (req: Request, res: Response) => {
  try {
    const orgId = req.query.organizationId as string;
    const { state, city } = req.query;
    
    const where: any = {};
    if (orgId) where.organizationId = orgId;
    if (state && state !== 'All') where.state = state as string;
    if (city && city !== 'All') where.city = city as string;

    const allVenues = await prisma.venue.findMany({
      where,
      include: {
        managers: true,
      }
    });
    
    // Map Prisma models to match frontend expected DTO (managerIds array)
    const formattedVenues = allVenues.map((venue: any) => ({
      ...venue,
      managerIds: venue.managers.map((m: any) => m.userId)
    }));
    
    return res.status(200).json({
      success: true,
      data: formattedVenues,
      message: 'Venues retrieved successfully'
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Server error',
      errors: [error.message]
    });
  }
};

export const createVenue = async (req: Request, res: Response) => {
  try {
    const venue = await prisma.venue.create({
      data: {
        organizationId: req.body.organizationId,
        name: req.body.name,
        address: req.body.address,
        description: req.body.description,
        capacity: req.body.capacity,
        type: req.body.type,
        equipment: req.body.equipment || [],
        policies: req.body.policies || [],
        imageUrl: req.body.imageUrl,
        state: req.body.state,
        city: req.body.city
      }
    });
    
    return res.status(201).json({
      success: true,
      data: venue,
      message: 'Venue created successfully'
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Server error',
      errors: [error.message]
    });
  }
};

export const updateVenue = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const venue = await prisma.venue.update({
      where: { id },
      data: req.body
    });
    
    return res.status(200).json({
      success: true,
      data: venue,
      message: 'Venue updated successfully'
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Server error',
      errors: [error.message]
    });
  }
};

export const deleteVenue = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.venue.delete({ where: { id } });
    
    return res.status(200).json({
      success: true,
      data: null,
      message: 'Venue deleted successfully'
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Server error',
      errors: [error.message]
    });
  }
};
