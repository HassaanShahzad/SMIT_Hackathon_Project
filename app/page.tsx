'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store';

export default function RootPage() {
  const router = useRouter();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const currentUser = useAppSelector((state) => state.auth.currentUser);

  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      router.replace('/login');
    } else if (currentUser.role === 'Owner' || currentUser.role === 'Admin') {
      router.replace('/dashboard');
    } else {
      router.replace('/kanban');
    }
  }, [isAuthenticated, currentUser, router]);

  return (
    <div className="min-h-screen bg-[#F6F7FB] dark:bg-[#000000] flex items-center justify-center">
      <div className="w-8 h-8 rounded-xl bg-[#5D5FEF] animate-pulse" />
    </div>
  );
}
