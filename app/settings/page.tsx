'use client';

import React from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { SettingsView } from '@/components/settings/SettingsView';

export default function SettingsPage() {
  return (
    <AuthGuard>
      <AppShell>
        <SettingsView />
      </AppShell>
    </AuthGuard>
  );
}
