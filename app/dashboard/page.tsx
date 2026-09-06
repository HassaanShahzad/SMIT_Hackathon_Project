'use client';

import React from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { ManagementDashboard } from '@/components/dashboard/ManagementDashboard';

export default function DashboardPage() {
  return (
    <AuthGuard>
      <AppShell>
        <ManagementDashboard />
      </AppShell>
    </AuthGuard>
  );
}
