import express, { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { prisma } from '../lib/prisma';
import { getConfig } from '../config/env';
import { industryTemplates } from '../templates/industries';
import { provisionAssistant } from '../services/assistant.service';
import { requireAuth } from '../middleware/auth.middleware';

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────
// GET /api/v1/voice/industries
// Returns the list of available industry templates
// ─────────────────────────────────────────────────────────────────────
router.get('/industries', requireAuth, (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: industryTemplates,
    message: 'Industries retrieved',
  });
});

// ─────────────────────────────────────────────────────────────────────
// POST /api/v1/voice/provision
// Provision or update a Vapi assistant for an organization
// ─────────────────────────────────────────────────────────────────────
router.post('/provision', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orgId, industry } = req.body;
    if (!orgId || !industry) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'orgId and industry are required.',
      });
    }

    const assistant = await provisionAssistant(orgId, industry);

    return res.json({
      success: true,
      data: assistant,
      message: 'Assistant provisioned successfully',
    });
  } catch (error: any) {
    console.error('❌ Provision Error:', error.message);
    return res.status(500).json({
      success: false,
      data: null,
      message: error.message || 'Failed to provision assistant',
    });
  }
});

// ─────────────────────────────────────────────────────────────────────
// GET /api/v1/voice/assistant?orgId=xxx
// Get the voice assistant record for an organization
// ─────────────────────────────────────────────────────────────────────
router.get('/assistant', requireAuth, async (req: Request, res: Response) => {
  try {
    const orgId = req.query.orgId as string;
    if (!orgId) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'orgId query parameter is required.',
      });
    }

    const assistant = await prisma.voiceAssistant.findUnique({
      where: { organizationId: orgId },
    });

    return res.json({
      success: true,
      data: assistant,
      message: assistant ? 'Assistant retrieved' : 'No assistant found',
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Server error',
    });
  }
});

// ─────────────────────────────────────────────────────────────────────
// GET /api/v1/voice/calls?orgId=xxx
// Get voice call logs for an organization's assistant
// ─────────────────────────────────────────────────────────────────────
router.get('/calls', requireAuth, async (req: Request, res: Response) => {
  try {
    const orgId = req.query.orgId as string;
    if (!orgId) {
      return res.status(400).json({
        success: false,
        data: [],
        message: 'orgId query parameter is required.',
      });
    }

    const assistant = await prisma.voiceAssistant.findUnique({
      where: { organizationId: orgId },
    });

    if (!assistant) {
      return res.json({
        success: true,
        data: [],
        message: 'No assistant found for this organization.',
      });
    }

    const calls = await prisma.voiceCallLog.findMany({
      where: { assistantId: assistant.id },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      success: true,
      data: calls,
      message: 'Calls retrieved',
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      data: [],
      message: 'Server error',
    });
  }
});

// ─────────────────────────────────────────────────────────────────────
// POST /api/v1/voice/webhook
// Main webhook called by Vapi for executing tool calls
// Supports: queryVenueVoxDatabase, requestSlotBooking
// ─────────────────────────────────────────────────────────────────────
router.post('/webhook', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message } = req.body;

    // Check if it's a tool-calls event from Vapi
    if (!message || message.type !== 'tool-calls') {
      return res.json({ success: true, message: 'Not a tool-call event.' });
    }

    const toolCall = message.toolCalls?.[0];
    if (!toolCall) {
      return res.status(400).json({ error: 'No tool call found.' });
    }

    // ── Route to the correct tool handler ──
    if (toolCall.name === 'queryVenueVoxDatabase') {
      return await handleQueryDatabase(toolCall, req, res);
    } else if (toolCall.name === 'requestSlotBooking') {
      return await handleBookSlot(toolCall, req, res);
    } else {
      return res.status(400).json({ error: `Unsupported tool call: ${toolCall.name}` });
    }
  } catch (error: any) {
    console.error('❌ Webhook Execution Error:', error.message);
    next(error);
  }
});

// ─────────────────────────────────────────────────────────────────────
// Tool Handler: queryVenueVoxDatabase
// Answers natural language questions about slot availability using Gemini
// ─────────────────────────────────────────────────────────────────────
async function handleQueryDatabase(toolCall: any, req: Request, res: Response) {
  const { question } = toolCall.arguments || {};
  if (!question) {
    return res.status(400).json({ error: 'Missing question argument.' });
  }

  const orgId = req.query.orgId as string;
  console.log(`🎙️ Received voice query: "${question}" for orgId: "${orgId || 'all'}"`);

  // 1. Query real Prisma DB for available slots (filtered by organizationId if provided)
  const availableSlots = await prisma.bookableSlot.findMany({
    where: { 
      status: 'AVAILABLE',
      ...(orgId ? { venue: { organizationId: orgId } } : {})
    },
    include: {
      venue: {
        include: {
          organization: true,
        },
      },
    },
  });

  const dbContext = JSON.stringify(
    availableSlots.map((s) => ({
      slotId: s.id,
      date: s.date,
      time: `${s.startTime} to ${s.endTime}`,
      budget: s.budget,
      venueName: s.venue?.name,
      venueType: s.venue?.type,
      venueAddress: s.venue?.address,
      policies: s.venue?.policies,
      organization: s.venue?.organization?.name,
    })),
    null,
    2
  );

  // 2. Formulate Prompt for Gemini
  const geminiPrompt = `You are a VenueVox Database Assistant.
Your job is to answer a user's natural language request (heard over a phone call by a voice agent) about gig slots using the provided database context.

Available Bookable Slots Context:
${dbContext}

User Request: "${question}"

You must answer the question based ONLY on the provided context. If the information is not in the context, say you don't know or don't have that information.
When listing slots, always include the slot ID so the user can reference it for booking.
Your response MUST be a single, valid JSON object containing exactly one key: "answer", which holds the natural language text you want the voice agent to speak to the user. Do not wrap the JSON in markdown code blocks.

JSON Schema format to follow:
{
  "answer": "Yes, we have a slot available tomorrow evening from 5 PM to 7 PM with a ₹200 budget at Sector 17 Brew & Cafe. The slot ID is s-1029. Would you like to book it?"
}
`;

  // 3. Invoke Gemini API
  const config = getConfig();
  if (!config.geminiApiKey) {
    console.warn('⚠️ GEMINI_API_KEY is not defined. Returning fallback message.');
    return res.json({
      results: [
        {
          toolCallId: toolCall.id,
          result: JSON.stringify({
            answer:
              'I am sorry, but the AI brain is not connected to the database right now. Please check the website for slot availability.',
          }),
        },
      ],
    });
  }

  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${config.geminiApiKey}`;

  console.log('🤖 Sending request to Gemini...');
  const geminiResponse = await axios.post(geminiUrl, {
    contents: [
      {
        parts: [{ text: geminiPrompt }],
      },
    ],
  });

  let rawText = geminiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

  // Clean any potential markdown wrappers
  rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();

  console.log('🤖 Gemini generated answer:', rawText);
  const queryResult = JSON.parse(rawText);

  // 4. Send results back to Vapi
  return res.json({
    results: [
      {
        toolCallId: toolCall.id,
        result: JSON.stringify(queryResult),
      },
    ],
  });
}

// ─────────────────────────────────────────────────────────────────────
// Tool Handler: requestSlotBooking
// Creates a real booking with PENDING status when a caller wants to reserve
// ─────────────────────────────────────────────────────────────────────
async function handleBookSlot(toolCall: any, req: Request, res: Response) {
  const { slotId, performerName } = toolCall.arguments || {};

  if (!slotId) {
    return res.json({
      results: [
        {
          toolCallId: toolCall.id,
          result: JSON.stringify({
            answer: 'I need the slot ID to make a booking. Could you tell me which slot you would like to book?',
          }),
        },
      ],
    });
  }

  console.log(`📞 Voice booking request: slot=${slotId}, performer=${performerName || 'walk-in'}`);

  try {
    // 1. Find the slot
    const slot = await prisma.bookableSlot.findUnique({
      where: { id: slotId },
      include: {
        venue: true,
      },
    });

    if (!slot) {
      return res.json({
        results: [
          {
            toolCallId: toolCall.id,
            result: JSON.stringify({
              answer: `I couldn't find a slot with ID ${slotId}. Could you double-check the slot details?`,
            }),
          },
        ],
      });
    }

    if (slot.status !== 'AVAILABLE') {
      return res.json({
        results: [
          {
            toolCallId: toolCall.id,
            result: JSON.stringify({
              answer: `Sorry, that slot is no longer available. Its current status is ${slot.status}. Would you like me to check for other available slots?`,
            }),
          },
        ],
      });
    }

    // 2. Try to find a performer by name (optional — walk-in callers may not be in the system)
    let performerId: string | null = null;
    if (performerName) {
      const performer = await prisma.performer.findFirst({
        where: {
          name: {
            contains: performerName,
            mode: 'insensitive',
          },
        },
      });
      performerId = performer?.id || null;
    }

    if (!performerId) {
      // If no performer found, we still acknowledge the booking intent
      // but can't create a formal booking without a performer ID
      // Instead, we'll note it and return a helpful response
      return res.json({
        results: [
          {
            toolCallId: toolCall.id,
            result: JSON.stringify({
              answer: `I found the slot on ${slot.date} from ${slot.startTime} to ${slot.endTime} at ${slot.venue?.name} with a budget of ₹${slot.budget}. However, I need your registered performer name to complete the booking. You can also book directly through our website at stagehub.com. Would you like me to help with anything else?`,
            }),
          },
        ],
      });
    }

    // 3. Create the booking
    const booking = await prisma.booking.create({
      data: {
        slotId: slot.id,
        venueId: slot.venueId,
        performerId: performerId,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        budget: slot.budget,
        status: 'PENDING',
      },
    });

    // 4. Update slot status to PENDING
    await prisma.bookableSlot.update({
      where: { id: slot.id },
      data: { status: 'PENDING', performerId: performerId },
    });

    // 5. Create notification(s) for the venue hosts
    const notificationsToCreate: string[] = [];

    // Find organization owner User ID
    const org = await prisma.organization.findUnique({
      where: { id: slot.venue.organizationId }
    });
    if (org?.userId) {
      notificationsToCreate.push(org.userId);
    }

    // Find venue managers User IDs
    const managers = await prisma.venueManager.findMany({
      where: { venueId: slot.venueId }
    });
    for (const m of managers) {
      if (!notificationsToCreate.includes(m.userId)) {
        notificationsToCreate.push(m.userId);
      }
    }

    // Create database notifications
    for (const targetUserId of notificationsToCreate) {
      await prisma.notification.create({
        data: {
          userId: targetUserId,
          title: 'New Voice Booking Request',
          message: `A booking request was made via phone call for ${slot.venue?.name} on ${slot.date} (${slot.startTime}-${slot.endTime}). Performer: ${performerName}.`,
          read: false,
        },
      });
    }

    console.log(`✅ Voice booking created: ${booking.id}`);

    return res.json({
      results: [
        {
          toolCallId: toolCall.id,
          result: JSON.stringify({
            answer: `Great news! I've submitted your booking request for ${slot.venue?.name} on ${slot.date} from ${slot.startTime} to ${slot.endTime} with a budget of ₹${slot.budget}. Your booking is now pending approval from the venue. They'll review it shortly. Is there anything else I can help with?`,
          }),
        },
      ],
    });
  } catch (error: any) {
    console.error('❌ Voice booking error:', error.message);
    return res.json({
      results: [
        {
          toolCallId: toolCall.id,
          result: JSON.stringify({
            answer: 'I encountered an error while processing your booking. Please try again or visit our website to book directly.',
          }),
        },
      ],
    });
  }
}

export default router;
