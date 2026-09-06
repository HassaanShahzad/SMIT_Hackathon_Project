'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  setActiveView,
  setCommandPaletteOpen,
  setSettingsOpen,
  setMobileNavOpen,
  setAuthModalOpen,
  ActiveView,
} from '@/store/slices/uiSlice';
import { logout } from '@/store/slices/authSlice';
import { markAsRead, markAllAsRead } from '@/store/slices/notificationSlice';
import { setTheme, AppTheme } from '@/store/slices/settingsSlice';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Search,
  Bell,
  Sun,
  Moon,
  Menu,
  CheckCheck,
  User as UserIcon,
  Settings,
  LogOut,
  LayoutDashboard,
  Kanban,
  ListTodo,
  Calendar,
  ChevronRight,
} from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const activeView = useAppSelector((state) => state.ui.activeView);
  const workspaces = useAppSelector((state) => state.workspace.workspaces);
  const activeWorkspaceId = useAppSelector((state) => state.workspace.activeWorkspaceId);
  const projects = useAppSelector((state) => state.project.projects);
  const activeProjectId = useAppSelector((state) => state.project.activeProjectId);
  const notifications = useAppSelector((state) => state.notification.notifications);

  const currentTheme = useAppSelector((state) => state.settings.theme);
  const isDark =
    currentTheme === 'dark' ||
    (currentTheme !== 'light' && typeof document !== 'undefined' && document.documentElement.classList.contains('dark'));

  const toggleTheme = () => {
    const nextTheme: AppTheme = isDark ? 'light' : 'dark';
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
    dispatch(setTheme(nextTheme));
  };

  const activeWorkspace =
    workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];
  const activeProject = projects.find((p) => p.id === activeProjectId);

  // Filter user notifications
  const userNotifications = notifications.filter(
    (n) => n.recipientId === currentUser?.id
  );
  const unreadCount = userNotifications.filter((n) => !n.read).length;

  const isAdminOrOwner =
    currentUser?.role === 'Owner' || currentUser?.role === 'Admin';

  const viewOptions: { id: ActiveView; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    ...(isAdminOrOwner
      ? [{ id: 'dashboard' as ActiveView, label: 'Dashboard', icon: LayoutDashboard }]
      : []),
    { id: 'kanban' as ActiveView, label: 'Kanban', icon: Kanban },
    { id: 'list' as ActiveView, label: 'List', icon: ListTodo },
    { id: 'calendar' as ActiveView, label: 'Calendar', icon: Calendar },
  ];

  return (
    <header className="h-16 w-full border-b border-[#E5E7EB] dark:border-[#222222] bg-white/95 dark:bg-[#0A0A0A]/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between z-30 shrink-0 transition-colors">
      {/* Left Section: Mobile Menu + Breadcrumbs + View Switcher */}
      <div className="flex items-center gap-3 sm:gap-6 min-w-0">
        {/* Mobile Nav Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-[#1A1D26] dark:text-[#EDEDED]"
          onClick={() => dispatch(setMobileNavOpen(true))}
        >
          <Menu className="w-5 h-5" />
        </Button>

        {/* Workspace & Project Breadcrumbs */}
        <div className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-[#7D8592] dark:text-[#888888]">
          <span className="flex items-center gap-1.5 text-[#1A1D26] dark:text-white font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#5D5FEF]" />
            {activeWorkspace?.name || 'Workspace'}
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-[#7D8592] dark:text-[#888888]" />
          <span className="truncate max-w-[140px] text-xs font-semibold px-2 py-0.5 rounded bg-[#F6F7FB] dark:bg-[#111111] text-[#1A1D26] dark:text-slate-200 border border-[#E5E7EB] dark:border-[#222222]">
            {activeProject ? activeProject.name : 'All Projects'}
          </span>
        </div>

        {/* View Switcher Pills */}
        <div className="flex items-center bg-[#F6F7FB] dark:bg-[#111111] p-1 rounded-xl gap-1 border border-[#E5E7EB] dark:border-[#222222]">
          {viewOptions.map((v) => {
            const Icon = v.icon;
            const isActive =
              pathname === `/${v.id}` ||
              (activeView === v.id && !['/dashboard', '/kanban', '/list', '/calendar', '/settings'].includes(pathname));
            return (
              <button
                key={v.id}
                onClick={() => {
                  dispatch(setActiveView(v.id));
                  router.push(`/${v.id}`);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${isActive
                    ? 'bg-[#5D5FEF] text-white dark:bg-white dark:text-black shadow-sm'
                    : 'text-[#7D8592] hover:text-[#1A1D26] dark:text-[#888888] dark:hover:text-white hover:bg-white/60 dark:hover:bg-[#1A1A1A]'
                  }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{v.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Section: Command Bar Trigger + Notifications + Theme Toggle + User Menu */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Command Palette Trigger */}
        <button
          onClick={() => dispatch(setCommandPaletteOpen(true))}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#E5E7EB] dark:border-[#222222] bg-[#F6F7FB] dark:bg-[#111111] hover:bg-[#ECEBFF]/50 dark:hover:bg-[#1A1A1A] text-[#7D8592] dark:text-[#888888] text-xs transition-colors"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Search or command...</span>
          <kbd className="ml-2 font-mono text-[10px] bg-white dark:bg-[#1A1A1A] px-1.5 py-0.5 rounded border border-[#E5E7EB] dark:border-[#2E2E2E] text-[#1A1D26] dark:text-[#EDEDED]">
            Ctrl+K
          </kbd>
        </button>

        {/* Notifications Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative text-[#1A1D26] dark:text-[#EDEDED] hover:bg-[#F6F7FB] dark:hover:bg-[#111111] rounded-xl"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-[#FF754C]" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 sm:w-96 p-0 shadow-xl border-[#E5E7EB] dark:border-[#222222] bg-white dark:bg-[#0A0A0A]">
            <div className="p-3 border-b border-[#E5E7EB] dark:border-[#222222] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-sm text-[#1A1D26] dark:text-white">Notifications</h4>
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="bg-[#FFEBF3] text-[#FF754C] text-[10px] font-bold dark:bg-[#1A1A1A]">
                    {unreadCount} new
                  </Badge>
                )}
              </div>
              {unreadCount > 0 && currentUser && (
                <button
                  onClick={() => dispatch(markAllAsRead(currentUser.id))}
                  className="text-xs text-[#5D5FEF] dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium"
                >
                  <CheckCheck className="w-3 h-3" /> Mark all read
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-[#E5E7EB] dark:divide-[#222222]">
              {userNotifications.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#7D8592]">
                  No notifications yet. You are all caught up!
                </div>
              ) : (
                userNotifications.slice(0, 15).map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => dispatch(markAsRead(notif.id))}
                    className={`p-3 text-xs cursor-pointer transition-colors ${!notif.read
                        ? 'bg-[#ECEBFF]/30 dark:bg-[#1A1A1A] font-medium'
                        : 'hover:bg-slate-50 dark:hover:bg-[#111111]/50'
                      }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {!notif.read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#FF754C] shrink-0" />
                        )}
                        <span className="font-semibold text-[#1A1D26] dark:text-white">
                          {notif.title}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#7D8592] dark:text-[#888888] shrink-0">
                        {formatRelativeTime(notif.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 text-[#7D8592] dark:text-[#888888] line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>
                  </div>
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* User Profile Menu with Presence Indicator */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 p-1 rounded-xl hover:bg-[#F6F7FB] dark:hover:bg-[#111111] transition-colors focus:outline-none">
              <div className="relative">
                <Avatar className="w-8 h-8 ring-2 ring-[#5D5FEF]/20">
                  <AvatarImage src={currentUser?.avatarUrl} alt={currentUser?.name} />
                  <AvatarFallback className="bg-[#5D5FEF] text-white text-xs font-bold">
                    {currentUser?.name?.slice(0, 2).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                {/* Active Presence Indicator Dot */}
                <span
                  title="Active"
                  className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#00D2B4]"
                />
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 shadow-xl border-[#E5E7EB] dark:border-[#222222] bg-white dark:bg-[#0A0A0A]">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold text-[#1A1D26] dark:text-white leading-none">
                  {currentUser?.name}
                </p>
                <p className="text-xs leading-none text-[#7D8592] dark:text-[#888888] truncate">
                  {currentUser?.email}
                </p>
                <div className="pt-1.5 flex items-center gap-1.5">
                  <Badge
                    variant="outline"
                    className="text-[10px] font-bold text-[#5D5FEF] border-[#5D5FEF]/30 bg-[#ECEBFF] dark:bg-[#1A1A1A] dark:text-indigo-400"
                  >
                    {currentUser?.role}
                  </Badge>
                  <span className="flex items-center gap-1 text-[10px] text-[#00D2B4] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00D2B4]" /> Active
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-[#E5E7EB] dark:bg-[#222222]" />
            <DropdownMenuItem
              onClick={() =>
                dispatch(setAuthModalOpen({ open: true, mode: 'profile' }))
              }
              className="cursor-pointer"
            >
              <UserIcon className="w-4 h-4 mr-2 text-[#7D8592]" />
              <span>Edit Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push('/settings')}
              className="cursor-pointer"
            >
              <Settings className="w-4 h-4 mr-2 text-[#7D8592]" />
              <span>Workspace Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[#E5E7EB] dark:bg-[#222222]" />
            <DropdownMenuItem
              onClick={() => {
                dispatch(logout());
                router.push('/login');
              }}
              className="cursor-pointer text-[#FF754C] focus:text-[#FF754C]"
            >
              <LogOut className="w-4 h-4 mr-2" />
              <span>Log Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
