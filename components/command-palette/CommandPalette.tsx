'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  setCommandPaletteOpen,
  setActiveView,
  setCreateTaskOpen,
  setCreateProjectOpen,
  setCreateWorkspaceOpen,
  setSettingsOpen,
  setAuthModalOpen,
  openTaskDetail,
} from '@/store/slices/uiSlice';
import { setActiveWorkspace } from '@/store/slices/workspaceSlice';
import { setActiveProject } from '@/store/slices/projectSlice';
import { setSearchQuery } from '@/store/slices/filterSlice';
import { logout } from '@/store/slices/authSlice';
import {
  canCreateTask,
  canManageProjects,
  canManageWorkspace,
  canCreateWorkspace,
  canViewDashboard,
} from '@/lib/permissions';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Search,
  CheckSquare,
  FolderPlus,
  Layers,
  Kanban,
  List,
  Calendar,
  Settings,
  LogOut,
  User,
  Shield,
  ArrowRight,
  LayoutDashboard,
} from 'lucide-react';

export function CommandPalette() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state) => state.ui.commandPaletteOpen);
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const workspaces = useAppSelector((state) => state.workspace.workspaces);
  const projects = useAppSelector((state) => state.project.projects);
  const tasks = useAppSelector((state) => state.task.tasks);
  const activeWorkspaceId = useAppSelector((state) => state.workspace.activeWorkspaceId);

  const [query, setQuery] = useState('');

  // Global Cmd+K / Ctrl+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        dispatch(setCommandPaletteOpen(!isOpen));
      }
      if (e.key === 'Escape' && isOpen) {
        dispatch(setCommandPaletteOpen(false));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatch, isOpen]);

  // Filter workspaces based on user role and membership
  const visibleWorkspaces = React.useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'Owner' || currentUser.role === 'Admin') {
      return workspaces;
    }
    return workspaces.filter(
      (w) => w.ownerId === currentUser.id || w.members.some((m) => m.userId === currentUser.id)
    );
  }, [workspaces, currentUser]);

  const activeWorkspace =
    visibleWorkspaces.find((w) => w.id === activeWorkspaceId) || visibleWorkspaces[0];
  const currentWorkspaceId = activeWorkspace?.id || activeWorkspaceId;

  if (!isOpen) return null;

  const currentWorkspaceProjects = projects.filter((p) => p.workspaceId === currentWorkspaceId);
  const currentWorkspaceTasks = tasks.filter((t) => t.workspaceId === currentWorkspaceId);

  const filteredTasks = query.trim()
    ? currentWorkspaceTasks.filter(
        (t) =>
          t.title.toLowerCase().includes(query.toLowerCase()) ||
          t.description.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5)
    : [];

  const execute = (action: () => void) => {
    action();
    dispatch(setCommandPaletteOpen(false));
    setQuery('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => dispatch(setCommandPaletteOpen(open))}>
      <DialogContent className="p-0 overflow-hidden sm:max-w-xl bg-white dark:bg-[#0A0A0A] border border-[#F0F1F5] dark:border-[#222222] shadow-2xl rounded-2xl">
        {/* Search header */}
        <div className="flex items-center px-4 py-3 border-b border-[#F0F1F5] dark:border-[#222222]">
          <Search className="w-4 h-4 text-[#7D8592] dark:text-[#888888] mr-2 shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, search tasks, or navigate (e.g. 'task', 'kanban')..."
            className="w-full bg-transparent text-sm text-[#1A1D26] dark:text-[#EDEDED] placeholder:text-[#7D8592] dark:placeholder:text-[#888888] outline-none"
            autoFocus
          />
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-[#7D8592] dark:text-[#888888] bg-[#F6F7FB] dark:bg-[#1A1A1A] border border-[#F0F1F5] dark:border-[#2E2E2E] rounded">
            ESC
          </kbd>
        </div>

        {/* Command list */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-3">
          {/* Direct Task Matches */}
          {filteredTasks.length > 0 && (
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[#7D8592] dark:text-[#888888] px-3 py-1">
                Tasks
              </div>
              <div className="space-y-0.5">
                {filteredTasks.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => execute(() => dispatch(openTaskDetail(t.id)))}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-left hover:bg-[#ECEBFF]/40 dark:hover:bg-[#1A1A1A] text-[#1A1D26] dark:text-slate-200 transition-colors"
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <CheckSquare className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span className="truncate">{t.title}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 ml-2 font-mono">
                      {t.status}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[#7D8592] dark:text-[#888888] px-3 py-1">
              Quick Actions
            </div>
            <div className="space-y-0.5">
              {canCreateTask(currentUser?.role) && (
                <button
                  onClick={() =>
                    execute(() =>
                      dispatch(setCreateTaskOpen({ open: true, defaultStatus: 'TODO' }))
                    )
                  }
                  className="w-full flex items-center px-3 py-2 rounded-lg text-xs text-left hover:bg-[#ECEBFF]/40 dark:hover:bg-[#1A1A1A] text-[#1A1D26] dark:text-slate-200 transition-colors"
                >
                  <CheckSquare className="w-4 h-4 text-[#5D5FEF] mr-2.5" />
                  <span>Create New Task</span>
                  <kbd className="ml-auto text-[10px] text-[#7D8592] dark:text-[#888888] font-mono">C</kbd>
                </button>
              )}

              {canManageProjects(currentUser?.role, activeWorkspace, currentUser?.id) && (
                <button
                  onClick={() => execute(() => dispatch(setCreateProjectOpen(true)))}
                  className="w-full flex items-center px-3 py-2 rounded-lg text-xs text-left hover:bg-[#ECEBFF]/40 dark:hover:bg-[#1A1A1A] text-[#1A1D26] dark:text-slate-200 transition-colors"
                >
                  <FolderPlus className="w-4 h-4 text-emerald-500 mr-2.5" />
                  <span>Create New Project</span>
                </button>
              )}

              {canCreateWorkspace(currentUser?.role) && (
                <button
                  onClick={() => execute(() => dispatch(setCreateWorkspaceOpen(true)))}
                  className="w-full flex items-center px-3 py-2 rounded-lg text-xs text-left hover:bg-[#ECEBFF]/40 dark:hover:bg-[#1A1A1A] text-[#1A1D26] dark:text-slate-200 transition-colors"
                >
                  <Layers className="w-4 h-4 text-[#5D5FEF] mr-2.5" />
                  <span>Create New Workspace</span>
                </button>
              )}
            </div>
          </div>

          {/* Views Navigation */}
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[#7D8592] dark:text-[#888888] px-3 py-1">
              Views
            </div>
            <div className="space-y-0.5">
              {canViewDashboard(currentUser?.role) && (
                <button
                  onClick={() =>
                    execute(() => {
                      dispatch(setActiveView('dashboard'));
                      router.push('/dashboard');
                    })
                  }
                  className="w-full flex items-center px-3 py-2 rounded-lg text-xs text-left hover:bg-[#ECEBFF]/40 dark:hover:bg-[#1A1A1A] text-[#1A1D26] dark:text-slate-200 transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4 text-[#5D5FEF] mr-2.5" />
                  <span>Switch to Executive Dashboard</span>
                </button>
              )}

              <button
                onClick={() =>
                  execute(() => {
                    dispatch(setActiveView('kanban'));
                    router.push('/kanban');
                  })
                }
                className="w-full flex items-center px-3 py-2 rounded-lg text-xs text-left hover:bg-[#ECEBFF]/40 dark:hover:bg-[#1A1A1A] text-[#1A1D26] dark:text-slate-200 transition-colors"
              >
                <Kanban className="w-4 h-4 text-[#5D5FEF] mr-2.5" />
                <span>Switch to Kanban View</span>
              </button>

              <button
                onClick={() =>
                  execute(() => {
                    dispatch(setActiveView('list'));
                    router.push('/list');
                  })
                }
                className="w-full flex items-center px-3 py-2 rounded-lg text-xs text-left hover:bg-[#ECEBFF]/40 dark:hover:bg-[#1A1A1A] text-[#1A1D26] dark:text-slate-200 transition-colors"
              >
                <List className="w-4 h-4 text-amber-500 mr-2.5" />
                <span>Switch to List View</span>
              </button>

              <button
                onClick={() =>
                  execute(() => {
                    dispatch(setActiveView('calendar'));
                    router.push('/calendar');
                  })
                }
                className="w-full flex items-center px-3 py-2 rounded-lg text-xs text-left hover:bg-[#ECEBFF]/40 dark:hover:bg-[#1A1A1A] text-[#1A1D26] dark:text-slate-200 transition-colors"
              >
                <Calendar className="w-4 h-4 text-emerald-500 mr-2.5" />
                <span>Switch to Calendar View</span>
              </button>
            </div>
          </div>

          {/* Switch Workspace */}
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[#7D8592] dark:text-[#888888] px-3 py-1">
              Switch Workspace
            </div>
            <div className="space-y-0.5">
              {visibleWorkspaces.map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => execute(() => dispatch(setActiveWorkspace(ws.id)))}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-left hover:bg-[#ECEBFF]/40 dark:hover:bg-[#1A1A1A] text-[#1A1D26] dark:text-slate-200 transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-[#5D5FEF]" />
                    <span>{ws.name}</span>
                  </div>
                  {activeWorkspaceId === ws.id && (
                    <span className="text-[10px] text-[#5D5FEF] font-semibold">Active</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Preferences & System */}
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[#7D8592] dark:text-[#888888] px-3 py-1">
              System & Preferences
            </div>
            <div className="space-y-0.5">
              <button
                onClick={() =>
                  execute(() => {
                    router.push('/settings');
                  })
                }
                className="w-full flex items-center px-3 py-2 rounded-lg text-xs text-left hover:bg-[#ECEBFF]/40 dark:hover:bg-[#1A1A1A] text-[#1A1D26] dark:text-slate-200 transition-colors"
              >
                <Settings className="w-4 h-4 text-[#7D8592] dark:text-[#888888] mr-2.5" />
                <span>Open Settings & Danger Zone</span>
              </button>

              <button
                onClick={() =>
                  execute(() =>
                    dispatch(setAuthModalOpen({ open: true, mode: 'login' }))
                  )
                }
                className="w-full flex items-center px-3 py-2 rounded-lg text-xs text-left hover:bg-[#ECEBFF]/40 dark:hover:bg-[#1A1A1A] text-[#1A1D26] dark:text-slate-200 transition-colors"
              >
                <User className="w-4 h-4 text-[#7D8592] dark:text-[#888888] mr-2.5" />
                <span>Switch User Persona</span>
              </button>

              <button
                onClick={() =>
                  execute(() => {
                    dispatch(logout());
                    router.push('/login');
                  })
                }
                className="w-full flex items-center px-3 py-2 rounded-lg text-xs text-left hover:bg-rose-500/10 text-rose-500 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
