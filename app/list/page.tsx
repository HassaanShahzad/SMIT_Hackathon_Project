'use client';

import React from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { WorkspaceViewContainer } from '@/components/tasks/WorkspaceViewContainer';

export default function ListPage() {
  return (
    <AuthGuard>
      <AppShell>
        <WorkspaceViewContainer currentView="list" />
      </AppShell>
    </AuthGuard>
  );
}
