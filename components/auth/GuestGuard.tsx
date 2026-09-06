'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store';

export function GuestGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const currentUser = useAppSelector((state) => state.auth.currentUser);

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      if (currentUser.role === 'Owner' || currentUser.role === 'Admin') {
        router.replace('/dashboard');
      } else {
        router.replace('/kanban');
      }
    }
  }, [isAuthenticated, currentUser, router]);

  return <>{children}</>;
}
