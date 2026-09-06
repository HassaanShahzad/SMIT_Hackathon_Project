'use client';

import React, { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { Toaster } from 'sonner';
import { store, useAppDispatch, useAppSelector } from './index';
import { seedInitialDataIfEmpty } from '@/lib/storage';
import { hydrateAuth } from './slices/authSlice';
import { hydrateWorkspaces } from './slices/workspaceSlice';
import { hydrateProjects } from './slices/projectSlice';
import { hydrateTasks } from './slices/taskSlice';
import { hydrateSubtasks } from './slices/subtaskSlice';
import { hydrateComments } from './slices/commentSlice';
import { hydrateNotifications } from './slices/notificationSlice';
import { hydrateActivities } from './slices/activitySlice';
import { hydrateFilters } from './slices/filterSlice';
import { hydrateSettings } from './slices/settingsSlice';

function HydrationGate({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.settings.theme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // 1. Seed if empty
    seedInitialDataIfEmpty();

    // 2. Hydrate Redux slices
    dispatch(hydrateAuth());
    dispatch(hydrateWorkspaces());
    dispatch(hydrateProjects());
    dispatch(hydrateTasks());
    dispatch(hydrateSubtasks());
    dispatch(hydrateComments());
    dispatch(hydrateNotifications());
    dispatch(hydrateActivities());
    dispatch(hydrateFilters());
    dispatch(hydrateSettings());

    setMounted(true);
  }, [dispatch]);

  // Apply dark / light theme to document element
  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else if (theme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
    } else {
      // system
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.add('light');
        root.classList.remove('dark');
      }
    }
  }, [theme, mounted]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#F6F7FB] dark:bg-[#000000] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#5D5FEF] to-violet-500 animate-pulse flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/30">
            W
          </div>
          <p className="text-sm font-medium text-[#7D8592] dark:text-[#888888] animate-pulse">Initializing Workspace Manager...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
      <Toaster
        position="bottom-right"
        richColors
        closeButton
        theme={theme === 'light' ? 'light' : 'dark'}
        toastOptions={{
          style: {
            borderRadius: '0.75rem',
            fontFamily: 'inherit',
          },
        }}
      />
    </>
  );
}

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <HydrationGate>{children}</HydrationGate>
    </Provider>
  );
}
