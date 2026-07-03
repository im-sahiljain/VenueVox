import { prisma } from '../lib/prisma';
import { createAssistant, updateAssistant } from './vapi.service';
import { generateVapiPayload, getIndustryTemplate } from '../templates/industries';
import { getConfig } from '../config/env';

/**
 * Provision or update a Vapi assistant for an organization.
 * Uses Prisma for all database operations.
 */
export async function provisionAssistant(orgId: string, industryKey: string) {
  // Get organization from Prisma
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
  });
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
  const vapiPayload = generateVapiPayload(industryKey, org.name, config.backendUrl, orgId);

  const vapiApiKey = config.vapiApiKey;
  if (!vapiApiKey) {
    throw new Error('VAPI_API_KEY is not configured on the backend. Provisioning requires a valid API key.');
  }

  // Check for existing assistant in DB
  let existing = await prisma.voiceAssistant.findUnique({
    where: { organizationId: orgId },
  });

  try {
    if (existing && existing.vapiAssistantId) {
      // UPDATE existing assistant on Vapi
      await prisma.voiceAssistant.update({
        where: { id: existing.id },
        data: { status: 'updating' },
      });

      await updateAssistant(
        existing.vapiAssistantId,
        vapiPayload,
        vapiApiKey
      );

      const updated = await prisma.voiceAssistant.update({
        where: { id: existing.id },
        data: {
          name: vapiPayload.name,
          industry: industryKey,
          config: vapiPayload as any,
          status: 'active',
          lastSyncedAt: new Date(),
          errorMessage: null,
        },
      });

      return updated;
    } else {
      // CREATE new assistant on Vapi
      if (existing) {
        // Record exists but has no vapiAssistantId — mark pending
        await prisma.voiceAssistant.update({
          where: { id: existing.id },
          data: { status: 'pending' },
        });
      } else {
        // Create a new local record
        existing = await prisma.voiceAssistant.create({
          data: {
            organizationId: orgId,
            name: vapiPayload.name,
            industry: industryKey,
            config: vapiPayload as any,
            status: 'pending',
          },
        });
      }

      const vapiResponse = await createAssistant(vapiPayload, vapiApiKey);

      const updated = await prisma.voiceAssistant.update({
        where: { id: existing.id },
        data: {
          vapiAssistantId: vapiResponse.id,
          name: vapiPayload.name,
          industry: industryKey,
          config: vapiPayload as any,
          status: 'active',
          lastSyncedAt: new Date(),
          errorMessage: null,
        },
      });

      return updated;
    }
  } catch (error: any) {
    // Mark assistant as failed
    if (existing) {
      await prisma.voiceAssistant.update({
        where: { id: existing.id },
        data: {
          status: 'failed',
          errorMessage: error.message,
        },
      });
    }
    throw error;
  }
}
