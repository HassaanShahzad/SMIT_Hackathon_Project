'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  setActiveView,
  setCreateTaskOpen,
  setCreateProjectOpen,
  setCreateWorkspaceOpen,
  setInviteMemberOpen,
  setSettingsOpen,
  setMobileNavOpen,
  setAuthModalOpen,
  ActiveView,
} from '@/store/slices/uiSlice';
import { setActiveWorkspace } from '@/store/slices/workspaceSlice';
import { setActiveProject, deleteProject } from '@/store/slices/projectSlice';
import {
  canCreateTask,
  canManageProjects,
  canDeleteProject,
  canInviteMembers,
  canManageWorkspace,
  canCreateWorkspace,
} from '@/lib/permissions';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  LayoutDashboard,
  Kanban,
  ListTodo,
  Calendar,
  Plus,
  ChevronsUpDown,
  Check,
  Folder,
  Layers,
  Sparkles,
  Trash2,
  UserPlus,
  Settings,
} from 'lucide-react';
import { toast } from 'sonner';

interface SidebarProps {
  isMobileDrawer?: boolean;
}

export function Sidebar({ isMobileDrawer = false }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const activeView = useAppSelector((state) => state.ui.activeView);
  const workspaces = useAppSelector((state) => state.workspace.workspaces);
  const activeWorkspaceId = useAppSelector((state) => state.workspace.activeWorkspaceId);
  const projects = useAppSelector((state) => state.project.projects);
  const activeProjectId = useAppSelector((state) => state.project.activeProjectId);
  const tasks = useAppSelector((state) => state.task.tasks);

  const [projectToDelete, setProjectToDelete] = useState<{ id: string; name: string } | null>(null);

  // Filter workspaces based on user role and membership for strict data isolation
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

  // Auto-sync active workspace if current activeWorkspace is not in visible list
  React.useEffect(() => {
    if (visibleWorkspaces.length > 0 && !visibleWorkspaces.some((w) => w.id === activeWorkspaceId)) {
      dispatch(setActiveWorkspace(visibleWorkspaces[0].id));
    }
  }, [visibleWorkspaces, activeWorkspaceId, dispatch]);

  const workspaceProjects = projects.filter(
    (p) => p.workspaceId === (activeWorkspace?.id || activeWorkspaceId) && p.status !== 'archived'
  );

  const isAdminOrOwner =
    currentUser?.role === 'Owner' || currentUser?.role === 'Admin';

  const handleNavClick = (view: ActiveView) => {
    dispatch(setActiveView(view));
    router.push(`/${view}`);
    if (isMobileDrawer) {
      dispatch(setMobileNavOpen(false));
    }
  };

  const handleProjectClick = (projectId: string | null) => {
    dispatch(setActiveProject(projectId));
    if (projectId) {
      router.push('/projects');
    }
    if (isMobileDrawer) {
      dispatch(setMobileNavOpen(false));
    }
  };

  const handleDeleteProjectConfirm = () => {
    if (projectToDelete) {
      dispatch(deleteProject(projectToDelete.id));
      toast.success(`Project "${projectToDelete.name}" deleted successfully.`);
      setProjectToDelete(null);
    }
  };

  return (
    <aside className="w-64 h-full flex flex-col bg-white dark:bg-[#0A0A0A] border-r border-[#F0F1F5] dark:border-[#222222] select-none transition-colors">
      {/* Top Header: Brand Logo & Workspace Switcher */}
      <div className="p-4 border-b border-[#F0F1F5] dark:border-[#222222] flex flex-col gap-3">
        {/* Brand Logo */}
        <div className="flex items-center gap-2.5 px-1">
          <div className="w-8 h-8 rounded-xl bg-[#5D5FEF] flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight text-[#1A1D26] dark:text-white leading-none">
              Workspace<span className="text-[#5D5FEF] dark:text-indigo-400">Pro</span>
            </h1>
            <p className="text-[10px] text-[#7D8592] dark:text-[#888888] font-medium tracking-wide">
              ENTERPRISE PLATFORM
            </p>
          </div>
        </div>

        {/* Workspace Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center justify-between p-2 rounded-xl border border-[#F0F1F5] dark:border-[#222222] bg-[#F6F7FB]/60 dark:bg-[#111111]/60 hover:bg-[#ECEBFF]/40 dark:hover:bg-[#1A1A1A] transition-colors text-left">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-lg bg-[#ECEBFF] dark:bg-[#1A1A1A] text-[#5D5FEF] dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Layers className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#1A1D26] dark:text-white truncate">
                    {activeWorkspace?.name || 'My Workspace'}
                  </p>
                </div>
              </div>
              <ChevronsUpDown className="w-3.5 h-3.5 text-[#7D8592] shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 shadow-xl border-[#F0F1F5] dark:border-[#222222] bg-white dark:bg-[#0A0A0A]">
            <DropdownMenuLabel className="text-xs font-semibold text-[#7D8592] dark:text-[#888888]">
              Workspaces
            </DropdownMenuLabel>
            {visibleWorkspaces.map((ws) => (
              <DropdownMenuItem
                key={ws.id}
                onClick={() => dispatch(setActiveWorkspace(ws.id))}
                className="flex items-center justify-between cursor-pointer text-xs"
              >
                <span className="truncate">{ws.name}</span>
                {ws.id === (activeWorkspace?.id || activeWorkspaceId) && (
                  <Check className="w-3.5 h-3.5 text-[#5D5FEF]" />
                )}
              </DropdownMenuItem>
            ))}
            {canCreateWorkspace(currentUser?.role) && (
              <>
                <DropdownMenuSeparator className="bg-[#F0F1F5] dark:bg-[#222222]" />
                <DropdownMenuItem
                  onClick={() => dispatch(setCreateWorkspaceOpen(true))}
                  className="text-xs text-[#5D5FEF] font-medium cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 mr-2" />
                  <span>Create Workspace</span>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* New Task Action Button */}
        {canCreateTask(currentUser?.role) && (
          <Button
            onClick={() => dispatch(setCreateTaskOpen({ open: true }))}
            className="w-full bg-[#5D5FEF] hover:bg-[#4E50E6] text-white dark:bg-white dark:text-black dark:hover:bg-slate-200 font-semibold text-xs py-2 rounded-xl shadow-md transition-all active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" /> New Task
          </Button>
        )}
      </div>

      {/* Main Navigation & Projects Area */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
        {/* Main Views */}
        <div className="space-y-0.5">
          <p className="px-3 text-[10px] font-bold tracking-wider text-[#7D8592] dark:text-[#888888] uppercase mb-1.5">
            Views
          </p>

          {isAdminOrOwner && (
            <button
              onClick={() => handleNavClick('dashboard')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                pathname === '/dashboard' || (activeView === 'dashboard' && pathname !== '/kanban' && pathname !== '/list' && pathname !== '/calendar' && pathname !== '/settings')
                  ? 'bg-[#ECEBFF] text-[#5D5FEF] dark:bg-[#1A1A1A] dark:text-white'
                  : 'text-[#1A1D26] dark:text-[#EDEDED] hover:bg-[#F6F7FB] dark:hover:bg-[#111111]'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-[#5D5FEF] dark:text-indigo-400" />
              <span>Executive Dashboard</span>
            </button>
          )}

          <button
            onClick={() => handleNavClick('kanban')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              pathname === '/kanban' || (activeView === 'kanban' && pathname !== '/dashboard' && pathname !== '/list' && pathname !== '/calendar' && pathname !== '/settings')
                ? 'bg-[#ECEBFF] text-[#5D5FEF] dark:bg-[#1A1A1A] dark:text-white'
                : 'text-[#1A1D26] dark:text-[#EDEDED] hover:bg-[#F6F7FB] dark:hover:bg-[#111111]'
            }`}
          >
            <Kanban className="w-4 h-4 text-[#6C5DD3] dark:text-purple-400" />
            <span>Kanban Board</span>
          </button>

          <button
            onClick={() => handleNavClick('list')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              pathname === '/list' || (activeView === 'list' && pathname !== '/dashboard' && pathname !== '/kanban' && pathname !== '/calendar' && pathname !== '/settings')
                ? 'bg-[#ECEBFF] text-[#5D5FEF] dark:bg-[#1A1A1A] dark:text-white'
                : 'text-[#1A1D26] dark:text-[#EDEDED] hover:bg-[#F6F7FB] dark:hover:bg-[#111111]'
            }`}
          >
            <ListTodo className="w-4 h-4 text-[#0098DA] dark:text-[#00D2B4]" />
            <span>List Grid</span>
          </button>

          <button
            onClick={() => handleNavClick('calendar')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              pathname === '/calendar' || (activeView === 'calendar' && pathname !== '/dashboard' && pathname !== '/kanban' && pathname !== '/list' && pathname !== '/settings')
                ? 'bg-[#ECEBFF] text-[#5D5FEF] dark:bg-[#1A1A1A] dark:text-white'
                : 'text-[#1A1D26] dark:text-[#EDEDED] hover:bg-[#F6F7FB] dark:hover:bg-[#111111]'
            }`}
          >
            <Calendar className="w-4 h-4 text-[#FF754C]" />
            <span>Calendar</span>
          </button>
        </div>

        {/* Projects Section */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-3 mb-1.5">
            <p className="text-[10px] font-bold tracking-wider text-[#7D8592] dark:text-[#888888] uppercase">
              Projects
            </p>
            {canManageProjects(currentUser?.role, activeWorkspace, currentUser?.id) && (
              <button
                onClick={() => dispatch(setCreateProjectOpen(true))}
                title="Create Project"
                className="w-5 h-5 rounded-md hover:bg-[#ECEBFF] dark:hover:bg-[#1A1A1A] text-[#7D8592] hover:text-[#5D5FEF] flex items-center justify-center transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* All Projects Filter */}
          <button
            onClick={() => handleProjectClick(null)}
            className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
              activeProjectId === null && pathname !== '/settings' && pathname !== '/dashboard'
                ? 'bg-[#ECEBFF] text-[#5D5FEF] dark:bg-[#1A1A1A] dark:text-white font-semibold'
                : 'text-[#7D8592] hover:text-[#1A1D26] dark:hover:text-white hover:bg-[#F6F7FB] dark:hover:bg-[#111111]'
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              <Folder className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">All Projects</span>
            </div>
            <Badge variant="secondary" className="text-[10px] h-4 px-1.5 font-normal bg-slate-100 dark:bg-slate-800">
              {tasks.filter((t) => t.workspaceId === (activeWorkspace?.id || activeWorkspaceId)).length}
            </Badge>
          </button>

          {/* Individual Projects List */}
          {workspaceProjects.map((proj) => {
            const projectTaskCount = tasks.filter((t) => t.projectId === proj.id).length;
            const isSelected = activeProjectId === proj.id;
            const userCanDelete = canDeleteProject(currentUser?.role, proj, currentUser?.id, activeWorkspace);

            return (
              <div
                key={proj.id}
                className={`group flex items-center justify-between px-3 py-1.5 rounded-xl text-xs transition-colors ${
                  isSelected
                    ? 'bg-[#ECEBFF] text-[#5D5FEF] dark:bg-[#1A1A1A] dark:text-white font-semibold'
                    : 'text-[#1A1D26] dark:text-[#EDEDED] hover:bg-[#F6F7FB] dark:hover:bg-[#111111]'
                }`}
              >
                <button
                  onClick={() => handleProjectClick(proj.id)}
                  className="flex items-center gap-2 min-w-0 flex-1 text-left"
                >
                  <span className="w-2 h-2 rounded-full bg-[#5D5FEF] shrink-0" />
                  <span className="truncate">{proj.name}</span>
                </button>

                <div className="flex items-center gap-1 shrink-0 ml-1">
                  {userCanDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setProjectToDelete({ id: proj.id, name: proj.name });
                      }}
                      title="Delete Project"
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-100 dark:hover:bg-rose-950 text-rose-500 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <Badge
                    variant="outline"
                    className="text-[10px] h-4 px-1 text-[#7D8592] border-none bg-slate-100 dark:bg-slate-800"
                  >
                    {projectTaskCount}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>

        {/* Invite Members Action */}
        {canInviteMembers(currentUser?.role, activeWorkspace, currentUser?.id) && (
          <div className="pt-2">
            <button
              onClick={() => dispatch(setInviteMemberOpen(true))}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-[#5D5FEF] dark:text-indigo-400 hover:bg-[#ECEBFF]/60 dark:hover:bg-[#1A1A1A] transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Invite Team Member</span>
            </button>
          </div>
        )}
      </div>

      {/* Bottom User Profile Section */}
      <div className="p-3 border-t border-[#F0F1F5] dark:border-[#222222] flex items-center justify-between bg-white dark:bg-[#0A0A0A]">
        <button
          onClick={() => dispatch(setAuthModalOpen({ open: true, mode: 'profile' }))}
          className="flex items-center gap-2.5 min-w-0 flex-1 p-1 rounded-xl hover:bg-[#F6F7FB] dark:hover:bg-[#111111] transition-colors text-left"
        >
          <div className="relative shrink-0">
            <Avatar className="w-8 h-8 ring-2 ring-[#5D5FEF]/20">
              <AvatarImage src={currentUser?.avatarUrl} alt={currentUser?.name} />
              <AvatarFallback className="bg-[#5D5FEF] text-white text-xs font-bold">
                {currentUser?.name?.slice(0, 2).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            {/* Active Presence Dot */}
            <span
              title="Active"
              className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#00D2B4] ring-2 ring-white dark:ring-[#0A0A0A]"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-[#1A1D26] dark:text-white truncate">
              {currentUser?.name || 'User'}
            </p>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-[#5D5FEF] dark:text-indigo-400 font-medium">
                {currentUser?.role || 'Member'}
              </span>
            </div>
          </div>
        </button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            router.push('/settings');
            if (isMobileDrawer) dispatch(setMobileNavOpen(false));
          }}
          className={`text-[#7D8592] hover:text-[#1A1D26] dark:hover:text-white rounded-xl shrink-0 ${
            pathname === '/settings' ? 'bg-[#ECEBFF] text-[#5D5FEF] dark:bg-[#1A1A1A] dark:text-white' : ''
          }`}
        >
          <Settings className="w-4 h-4" />
        </Button>
      </div>

      {/* Delete Project Confirmation Dialog */}
      <AlertDialog
        open={!!projectToDelete}
        onOpenChange={(open) => !open && setProjectToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete the project &quot;
              {projectToDelete?.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProjectConfirm}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              Delete Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
  );
}
