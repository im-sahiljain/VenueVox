export const industryTemplates = [
  {
    key: 'cafe',
    label: 'Cafe & Coffee Shop',
    icon: '☕',
    capabilities: [
      'Answers slot availability queries',
      'Provides cafe hours and location',
      'Handles acoustic/solo performer policies',
      'Answers basic menu questions'
    ]
  },
  {
    key: 'restaurant',
    label: 'Restaurant & Grill',
    icon: '🍽️',
    capabilities: [
      'Answers slot availability queries',
      'Provides restaurant hours and location',
      'Handles background music/band policies',
      'Answers dining reservation queries'
    ]
  },
  {
    key: 'bar',
    label: 'Bar & Lounge',
    icon: '🍸',
    capabilities: [
      'Answers slot availability queries',
      'Provides bar hours, cover charge info',
      'Handles DJ and band booking policies',
      'Answers age restriction questions'
    ]
  },
  {
    key: 'clubhouse',
    label: 'Clubhouse & Resort',
    icon: '🏛️',
    capabilities: [
      'Answers slot availability queries',
      'Provides clubhouse hours and location',
      'Handles corporate and large band policies',
      'Answers event space rental questions'
    ]
  }
];

export function getIndustryTemplate(key: string) {
  return industryTemplates.find((t) => t.key === key);
}

export function generateVapiPayload(industryKey: string, orgName: string, backendUrl: string, orgId: string) {
  const webhookUrl = `${backendUrl}/api/v1/voice/webhook?orgId=${orgId}`;
  const template = getIndustryTemplate(industryKey);
  const capabilitiesText = template
    ? template.capabilities.map((c) => `- ${c}`).join('\n')
    : '';

  const basePrompt = `You are a helpful AI receptionist for ${orgName}, a ${template?.label || industryKey}. 
Your main job is to answer questions about the venue, policies, and calendar slot availability for performers looking to book a gig.

Specifically, you have the following capabilities and must handle queries about:
${capabilitiesText}

When users ask questions about slots, performers, or venue details, use your "queryVenueVoxDatabase" tool to search our internal database.
You must NEVER invent or hallucinate dates, slots, or bookings. Always use the tool.

When a user wants to book or reserve a slot, use the "requestSlotBooking" tool. You will need:
1. The slot ID (which you can get from a previous query)
2. The performer's name

Example flows:
User: "Do you have any available slots this weekend?"
You: [Call queryVenueVoxDatabase] "Yes, we have an acoustic slot open on Saturday night with a ₹200 budget. The slot ID is s-1029."

User: "I'd like to book that slot. My name is Sarah."
You: [Call requestSlotBooking with slotId and performerName] "Great! I've submitted your booking request. It's now pending approval from the venue."

Be concise, polite, and act as a representative of ${orgName}. Do not mention that you are using a tool or database.
`;

  return {
    name: `${orgName} Receptionist`,
    firstMessage: `Hello, thank you for calling ${orgName}. I'm the virtual assistant. Are you calling to inquire about gig slots, make a booking, or something else?`,
    endCallMessage: `Thank you for calling ${orgName}. Have a wonderful day!`,
    voice: {
      provider: "vapi",
      voiceId: "Neil",
      version: 2
    },
    model: {
      provider: "openai",
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: basePrompt
        }
      ],
      tools: [
        {
          type: "function",
          messages: [
            { type: "request-start", content: "Let me check our calendar for you really quick." },
            { type: "request-complete", content: "Thanks for waiting." },
            { type: "request-failed", content: "I'm having trouble accessing the calendar right now. Please try again later." }
          ],
          function: {
            name: "queryVenueVoxDatabase",
            description: "Searches the VenueVox database for available gig slots, venue details, and booking information. Use this whenever the caller asks about availability, dates, times, venues, or pricing.",
            parameters: {
              type: "object",
              properties: {
                question: {
                  type: "string",
                  description: "The natural language question to execute against the database (e.g., 'What slots are available tomorrow?')"
                }
              },
              required: ["question"]
            }
          },
          server: { url: webhookUrl }
        },
        {
          type: "function",
          messages: [
            { type: "request-start", content: "Let me process your booking request." },
            { type: "request-complete", content: "Your booking has been processed." },
            { type: "request-failed", content: "I'm having trouble processing the booking right now. Please try again or visit our website." }
          ],
          function: {
            name: "requestSlotBooking",
            description: "Books or reserves a specific available gig slot for a performer. Creates a pending booking that the venue will review and approve.",
            parameters: {
              type: "object",
              properties: {
                slotId: {
                  type: "string",
                  description: "The unique ID of the slot to book (e.g., 's-1029'). Get this from a previous queryVenueVoxDatabase call."
                },
                performerName: {
                  type: "string",
                  description: "The name of the performer who wants to book the slot (e.g., 'Acoustic Duo', 'DJ Electro')."
                }
              },
              required: ["slotId", "performerName"]
            }
          },
          server: { url: webhookUrl }
        }
      ]
    }
  };
}


