'use client';

import React from 'react';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { GuestGuard } from '@/components/auth/GuestGuard';

export default function SignupPage() {
  return (
    <GuestGuard>
      <AuthScreen initialTab="signup" />
    </GuestGuard>
  );
}
