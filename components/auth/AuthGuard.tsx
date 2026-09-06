'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const currentUser = useAppSelector((state) => state.auth.currentUser);

  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      router.replace('/login');
    }
  }, [isAuthenticated, currentUser, router]);

  if (!isAuthenticated || !currentUser) {
    return (
      <div className="min-h-screen bg-[#F6F7FB] dark:bg-[#000000] flex items-center justify-center">
        <div className="w-8 h-8 rounded-xl bg-[#5D5FEF] animate-pulse" />
      </div>
    );
  }

  return <>{children}</>;
}
