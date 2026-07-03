'use client';

import React from 'react';
import { useAppSelector } from '@/lib/store/store';
import VoiceAITab from '@/components/VoiceAITab';

export default function OrganizationVoiceAI() {
  const { user } = useAppSelector((state) => state.organization);

  const queryOrgId = user?.isManager ? user.parentOrgId : user?.id;

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 dark:text-slate-100">
      <VoiceAITab user={user} orgId={queryOrgId || ''} />
    </div>
  );
}
