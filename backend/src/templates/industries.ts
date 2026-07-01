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

export function generateVapiPayload(industryKey: string, orgName: string, backendUrl: string) {
  const webhookUrl = `${backendUrl}/api/v1/voice/webhook`;

  const basePrompt = `You are a helpful AI receptionist for ${orgName}, a ${industryKey}. 
Your main job is to answer questions about the venue, policies, and calendar slot availability for performers looking to book a gig.

When users ask questions about slots, performers, or venue details, use your "queryVenueVoxDatabase" tool to search our internal database.
You must NEVER invent or hallucinate dates, slots, or bookings. Always use the tool.

Example flow:
User: "Do you have any available slots this weekend?"
You: [Call tool to check slots] "Yes, we have an acoustic slot open on Saturday night with a ₹200 budget."

Be concise, polite, and act as a representative of ${orgName}. Do not mention that you are using a tool or database.
`;

  return {
    name: `${orgName} Receptionist`,
    firstMessage: `Hello, thank you for calling ${orgName}. I'm the virtual assistant. Are you calling to inquire about gig slots or something else?`,
    endCallMessage: `Thank you for calling ${orgName}. Have a wonderful day!`,
    voice: {
      provider: "playht",
      voiceId: "s3://voice-cloning-zero-shot/d9ff78ba-d016-47f6-b0ef-dd630f59414e/female-cs/manifest.json" // Elliot
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
            {
              type: "request-start",
              content: "Let me check our calendar for you really quick."
            },
            {
              type: "request-complete",
              content: "Thanks for waiting."
            },
            {
              type: "request-failed",
              content: "I'm having trouble accessing the calendar right now. Please try again later."
            }
          ],
          function: {
            name: "queryVenueVoxDatabase",
            description: "Translates a natural language question into a query against the VenueVox in-memory database.",
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
          server: {
            url: webhookUrl
          }
        }
      ]
    }
  };
}
