'use client';

import React from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { TaskDetailSheet } from '@/components/tasks/TaskDetailSheet';
import { CreateTaskDialog } from '@/components/forms/CreateTaskDialog';
import { EditTaskDialog } from '@/components/forms/EditTaskDialog';
import { CreateProjectDialog } from '@/components/forms/CreateProjectDialog';
import { CreateWorkspaceDialog } from '@/components/forms/CreateWorkspaceDialog';
import { SettingsModal } from '@/components/settings/SettingsModal';
import { CommandPalette } from '@/components/command-palette/CommandPalette';
import { AuthModal } from '@/components/forms/AuthModal';
import { InviteMemberDialog } from '@/components/forms/InviteMemberDialog';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useAppDispatch, useAppSelector } from '@/store';
import { setMobileNavOpen } from '@/store/slices/uiSlice';

export function AppShell({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const mobileNavOpen = useAppSelector((state) => state.ui.mobileNavOpen);

  return (
    <div className="flex h-full w-full min-h-screen overflow-hidden bg-[#F6F7FB] text-[#1A1D26] dark:bg-[#000000] dark:text-[#EDEDED] antialiased font-sans border-0 outline-none ring-0">
      {/* Desktop Left Sidebar */}
      <div className="hidden md:flex shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Drawer */}
      <Sheet open={mobileNavOpen} onOpenChange={(open) => dispatch(setMobileNavOpen(open))}>
        <SheetContent side="left" className="p-0 w-72">
          <Sidebar isMobileDrawer />
        </SheetContent>
      </Sheet>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1600px] mx-auto w-full">
            {children}
          </div>
        </main>
      </div>

      {/* Global Modals & Drawers */}
      <TaskDetailSheet />
      <CreateTaskDialog />
      <EditTaskDialog />
      <CreateProjectDialog />
      <CreateWorkspaceDialog />
      <SettingsModal />
      <CommandPalette />
      <AuthModal />
      <InviteMemberDialog />
    </div>
  );
}
