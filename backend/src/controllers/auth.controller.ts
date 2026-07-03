import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password, role, state, city } = req.body;
    
    if (!email || !role) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Email and role are required',
        errors: ['Missing fields']
      });
    }

    const uppercaseRole = role.toUpperCase() as any;

    // Find a matching user
    let user = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        role: uppercaseRole
      }
    });

    let performer = null;

    if (!user) {
      // Register on the fly
      const userId = `u-${role === 'organization' ? 'org' : 'perf'}-${Date.now()}`;
      const name = role === 'organization' ? 'New Venue Partner' : 'Rising Artist';
      
      user = await prisma.user.create({
        data: {
          id: userId,
          email: email.toLowerCase(),
          passwordHash: 'password123',
          role: uppercaseRole,
          name: name,
          isManager: false
        }
      });

      if (role === 'performer') {
        const performerId = `p-${Date.now()}`;
        performer = await prisma.performer.create({
          data: {
            id: performerId,
            userId: user.id,
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
            state: state || null,
            city: city || null
          }
        });
      } else if (role === 'organization') {
        await prisma.organization.create({
          data: {
            id: user.id, // match user id
            userId: user.id,
            name: name,
            state: state || null,
            city: city || null
          }
        });
      }
      } else {
        // If user exists, update their profile with the selected state and city
        if (role === 'performer') {
          await prisma.performer.updateMany({
            where: { userId: user.id },
            data: {
              state: state || null,
              city: city || null
            }
          });
          performer = await prisma.performer.findFirst({
            where: { userId: user.id }
          });
        } else if (role === 'organization') {
          await prisma.organization.updateMany({
            where: { userId: user.id },
            data: {
              state: state || null,
              city: city || null
            }
          });
        }
      }

    let organization = null;
    if (role === 'organization') {
      organization = await prisma.organization.findFirst({
        where: { userId: user.id }
      });
    }

    const token = `mock-jwt-token-for-${user.id}`;
    
    return res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role.toLowerCase(),
          isManager: user.isManager,
          parentOrgId: user.parentOrgId
        },
        performer: performer,
        organization: organization
      },
      message: 'Login successful'
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
