import { users, voiceAssistants, VoiceAssistant } from '../store';
import { createAssistant, updateAssistant } from './vapi.service';
import { generateVapiPayload, getIndustryTemplate } from '../templates/industries';
import { getConfig } from '../config/env';

/**
 * Provision or update a Vapi assistant for an organization
 */
export async function provisionAssistant(orgId: string, industryKey: string) {
  // Get organization
  const org = users.find(u => u.id === orgId && u.role === 'organization');
  if (!org) {
    throw new Error('Organization not found.');
  }

  // Validate industry template exists
  const template = getIndustryTemplate(industryKey);
  if (!template) {
    throw new Error(`Industry template "${industryKey}" not found.`);
  }

  // Generate Vapi payload
  const config = getConfig();
  const vapiPayload = generateVapiPayload(industryKey, org.name, config.backendUrl);

  // Check for existing assistant
  let assistantIndex = voiceAssistants.findIndex((a) => a.organizationId === orgId);
  let assistant: VoiceAssistant;

  const vapiApiKey = config.vapiApiKey;
  if (!vapiApiKey) {
    throw new Error('VAPI_API_KEY is not configured on the backend. Provisioning requires a valid API key.');
  }

  try {
    if (assistantIndex !== -1 && voiceAssistants[assistantIndex].vapiAssistantId) {
      // UPDATE existing assistant
      assistant = voiceAssistants[assistantIndex];
      assistant.status = 'updating';

      const vapiResponse = await updateAssistant(
        assistant.vapiAssistantId as string,
        vapiPayload,
        vapiApiKey
      );

      assistant.name = vapiPayload.name;
      assistant.industry = industryKey;
      assistant.config = vapiPayload;
      assistant.status = 'active';
      assistant.lastSyncedAt = new Date().toISOString();
      assistant.errorMessage = null;

      return assistant;
    } else {
      // CREATE new assistant
      if (assistantIndex !== -1) {
        assistant = voiceAssistants[assistantIndex];
        assistant.status = 'pending';
      } else {
        assistant = {
          id: `va-${Date.now()}`,
          organizationId: orgId,
          vapiAssistantId: null,
          name: vapiPayload.name,
          industry: industryKey,
          config: vapiPayload,
          status: 'pending',
          errorMessage: null,
          lastSyncedAt: null,
          createdAt: new Date().toISOString()
        };
        voiceAssistants.push(assistant);
      }

      const vapiResponse = await createAssistant(vapiPayload, vapiApiKey);

      assistant.vapiAssistantId = vapiResponse.id;
      assistant.name = vapiPayload.name;
      assistant.industry = industryKey;
      assistant.config = vapiPayload;
      assistant.status = 'active';
      assistant.lastSyncedAt = new Date().toISOString();
      assistant.errorMessage = null;

      return assistant;
    }
  } catch (error: any) {
    // Mark assistant as failed
    if (assistantIndex !== -1) {
      voiceAssistants[assistantIndex].status = 'failed';
      voiceAssistants[assistantIndex].errorMessage = error.message;
    } else if (assistant!) {
      assistant.status = 'failed';
      assistant.errorMessage = error.message;
    }
    throw error;
  }
}
