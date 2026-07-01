import express, { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { bookableSlots, venues, users } from '../store';
import { getConfig } from '../config/env';

const router = express.Router();

/**
 * POST /api/v1/voice/webhook
 * Main webhook called by Vapi for executing dynamic DB queries
 */
router.post('/webhook', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message } = req.body;
    
    // Check if it's a tool-calls event from Vapi
    if (!message || message.type !== 'tool-calls') {
      return res.json({ success: true, message: 'Not a tool-call event.' });
    }
    
    const toolCall = message.toolCalls?.[0];
    if (!toolCall || toolCall.name !== 'queryVenueVoxDatabase') {
      return res.status(400).json({ error: 'Unsupported tool call.' });
    }
    
    const { question } = toolCall.arguments || {};
    if (!question) {
      return res.status(400).json({ error: 'Missing question argument.' });
    }
    
    console.log(`🎙️ Received voice query: "${question}"`);

    // 1. Prepare minimal DB context
    // We only pass available slots to save tokens
    const availableSlots = bookableSlots.filter(s => s.status === 'Available').map(s => {
      const venue = venues.find(v => v.id === s.venueId);
      const org = users.find(u => u.id === venue?.organizationId);
      return {
        date: s.date,
        time: `${s.startTime} to ${s.endTime}`,
        budget: s.budget,
        venueName: venue?.name,
        venueType: venue?.type,
        policies: venue?.policies,
        organization: org?.name
      };
    });

    const dbContext = JSON.stringify(availableSlots, null, 2);

    // 2. Formulate Prompt for Gemini
    const geminiPrompt = `You are a VenueVox Database Assistant.
Your job is to answer a user's natural language request (heard over a phone call by a voice agent) about gig slots using the provided database context.

Available Bookable Slots Context:
${dbContext}

User Request: "${question}"

You must answer the question based ONLY on the provided context. If the information is not in the context, say you don't know or don't have that information.
Your response MUST be a single, valid JSON object containing exactly one key: "answer", which holds the natural language text you want the voice agent to speak to the user. Do not wrap the JSON in markdown code blocks.

JSON Schema format to follow:
{
  "answer": "Yes, we have a slot available tomorrow evening from 5 PM to 7 PM with a ₹200 budget."
}
`;

    // 3. Invoke Gemini API via REST call
    const config = getConfig();
    if (!config.geminiApiKey) {
      console.warn('⚠️ GEMINI_API_KEY is not defined. Returning fallback message.');
      return res.json({
        results: [
          {
            toolCallId: toolCall.id,
            result: JSON.stringify({ answer: 'I am sorry, but the AI brain is not connected to the database right now. Please check the website for slot availability.' })
          }
        ]
      });
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${config.geminiApiKey}`;
    
    console.log('🤖 Sending request to Gemini...');
    const geminiResponse = await axios.post(geminiUrl, {
      contents: [
        {
          parts: [{ text: geminiPrompt }]
        }
      ]
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
          result: JSON.stringify(queryResult)
        }
      ]
    });

  } catch (error: any) {
    console.error('❌ Webhook Execution Error:', error.message);
    next(error);
  }
});

export default router;
