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
// POST /api/v1/voice/deprovision
// Delete Vapi assistant and clear database record for an organization
// ─────────────────────────────────────────────────────────────────────
router.post('/deprovision', requireAuth, async (req: Request, res: Response) => {
  try {
    const { orgId } = req.body;
    if (!orgId) {
      return res.status(400).json({
        success: false,
        message: 'orgId is required.',
      });
    }

    const assistant = await prisma.voiceAssistant.findUnique({
      where: { organizationId: orgId },
    });

    if (assistant) {
      if (assistant.vapiAssistantId) {
        const config = getConfig();
        const vapiApiKey = config.vapiApiKey;
        if (vapiApiKey) {
          try {
            const { deleteAssistant } = require('../services/vapi.service');
            await deleteAssistant(assistant.vapiAssistantId, vapiApiKey);
          } catch (vapiErr: any) {
            console.error('⚠️ Failed to delete assistant from Vapi:', vapiErr.message);
            // Proceed to clear local DB even if Vapi deletion fails
          }
        }
      }

      await prisma.voiceAssistant.delete({
        where: { id: assistant.id },
      });
    }

    return res.json({
      success: true,
      message: 'Assistant deleted successfully.',
    });
  } catch (error: any) {
    console.error('❌ Deprovision Error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to deprovision assistant',
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
// Supports: queryVenueVoxAIDatabase, requestSlotBooking
// ─────────────────────────────────────────────────────────────────────
router.post('/webhook', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message } = req.body;

    // Check if it's a tool-calls event from Vapi
    if (!message || message.type !== 'tool-calls') {
      return res.json({ success: true, message: 'Not a tool-call event.' });
    }

    const rawToolCall = message.toolCalls?.[0];
    if (!rawToolCall) {
      return res.status(400).json({ error: 'No tool call found.' });
    }

    // Normalize toolCall properties for OpenAI / Vapi format compatibility
    const toolCall = {
      id: rawToolCall.id,
      name: rawToolCall.name,
      arguments: rawToolCall.arguments || {}
    };

    if (rawToolCall.function) {
      toolCall.name = rawToolCall.function.name;
      if (typeof rawToolCall.function.arguments === 'string') {
        try {
          toolCall.arguments = JSON.parse(rawToolCall.function.arguments);
        } catch (e) {
          toolCall.arguments = {};
        }
      } else if (rawToolCall.function.arguments) {
        toolCall.arguments = rawToolCall.function.arguments;
      }
    }

    // ── Route to the correct tool handler ──
    if (toolCall.name === 'queryVenueVoxAIDatabase') {
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
// Tool Handler: queryVenueVoxAIDatabase
// Answers natural language questions about slot availability using Gemini
// ─────────────────────────────────────────────────────────────────────
async function handleQueryDatabase(toolCall: any, req: Request, res: Response) {
  const { question } = toolCall.arguments || {};
  if (!question) {
    return res.status(400).json({ error: 'Missing question argument.' });
  }

  const orgId = req.query.orgId as string;
  console.log(`🎙️ Received voice query: "${question}" for orgId: "${orgId || 'all'}"`);

  const now = new Date();
  const localDateStr = now.toLocaleDateString('en-CA');
  const localTimeStr = now.toTimeString().slice(0, 5);

  // 1. Query real Prisma DB for available slots (filtered by organizationId if provided)
  const availableSlots = await prisma.bookableSlot.findMany({
    where: { 
      status: 'AVAILABLE',
      OR: [
        {
          date: {
            gt: localDateStr
          }
        },
        {
          date: {
            equals: localDateStr
          },
          startTime: {
            gt: localTimeStr
          }
        }
      ],
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
  const geminiPrompt = `You are a VenueVoxAI Database Assistant.
Your job is to answer a user's natural language request (heard over a phone call by a voice agent) about gig slots using the provided database context.

Available Bookable Slots Context:
${dbContext}

User Request: "${question}"

You must answer the question based ONLY on the provided context. If the information is not in the context, say you don't know or don't have that information.
NEVER speak or mention slot IDs (like s-xxx) to the caller. Instead, describe slots using their day of the week, date, and time (e.g. 'Monday, July 6th from 7 PM to 10 PM') so it sounds natural.
Your response MUST be a single, valid JSON object containing exactly one key: "answer", which holds the natural language text you want the voice agent to speak to the user. Do not wrap the JSON in markdown code blocks.

JSON Schema format to follow:
{
  "answer": "Yes, we have a slot available tomorrow evening from 5 PM to 7 PM with a ₹200 budget at Sector 17 Brew & Cafe. Would you like to book it?"
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

  let queryResult;
  try {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${config.geminiApiKey}`;

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
    queryResult = JSON.parse(rawText);
  } catch (geminiError: any) {
    console.warn('⚠️ Gemini request failed (possibly rate limited 429). Formatting local fallback response...', geminiError.message);
    
    // Generate a friendly local text response using the database results directly
    let fallbackAnswer = "";
    if (availableSlots.length === 0) {
      fallbackAnswer = "I'm sorry, we don't have any available slots open for booking at the moment. Please check back later.";
    } else {
      const slotDescriptions = availableSlots.slice(0, 3).map(s => {
        const slotDate = new Date(s.date + 'T00:00:00');
        const weekday = slotDate.toLocaleDateString('en-US', { weekday: 'long' });
        const month = slotDate.toLocaleDateString('en-US', { month: 'long' });
        const dayNum = slotDate.getDate();
        
        let suffix = "th";
        if (dayNum === 1 || dayNum === 21 || dayNum === 31) suffix = "st";
        else if (dayNum === 2 || dayNum === 22) suffix = "nd";
        else if (dayNum === 3 || dayNum === 23) suffix = "rd";
        
        const dateStr = `${weekday}, ${month} ${dayNum}${suffix}`;
        
        // Convert times to 12-hour format
        const to12hLocal = (time24: string) => {
          if (!time24) return '';
          const [hStr, mStr] = time24.split(':');
          const h = parseInt(hStr, 10);
          const ampm = h >= 12 ? 'PM' : 'AM';
          const displayH = h % 12 || 12;
          return `${displayH}:${mStr} ${ampm}`;
        };
        
        return `on ${dateStr} from ${to12hLocal(s.startTime)} to ${to12hLocal(s.endTime)} with a budget of ₹${s.budget} at ${s.venue?.name}`;
      });
      
      fallbackAnswer = `Yes, we have some slots available! We have a slot ${slotDescriptions.join(', and another slot ')}. Which of these would you like to book?`;
    }
    
    queryResult = {
      answer: fallbackAnswer
    };
  }

  // 4. Send results back to Vapi
  return res.json({
    results: [
      {
        toolCallId: toolCall.id,
        result: JSON.stringify({
          answer: queryResult.answer,
          slots: availableSlots.map((s) => ({
            id: s.id,
            date: s.date,
            startTime: s.startTime,
            endTime: s.endTime,
          })),
        }),
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
              answer: `I found the slot on ${slot.date} from ${slot.startTime} to ${slot.endTime} at ${slot.venue?.name} with a budget of ₹${slot.budget}. However, I need your registered performer name to complete the booking. You can also book directly through our website at venuevoxai.com. Would you like me to help with anything else?`,
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
