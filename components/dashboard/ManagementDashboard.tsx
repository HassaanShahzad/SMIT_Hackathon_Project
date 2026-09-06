'use client';

import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { updateWorkspace, deleteWorkspace, updateMemberRole } from '@/store/slices/workspaceSlice';
import { updateProject, deleteProject } from '@/store/slices/projectSlice';
import { updateUserRole } from '@/store/slices/authSlice';
import { setActiveView } from '@/store/slices/uiSlice';
import {
  canEditWorkspace,
  canDeleteWorkspace,
  canEditProject,
  canDeleteProject,
  canViewDashboard,
} from '@/lib/permissions';
import { isOverdue, formatRelativeTime } from '@/lib/utils';
import { Workspace } from '@/types/workspace';
import { Project } from '@/types/project';
import { UserRole } from '@/types/auth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Layers,
  Folder,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Pencil,
  Trash2,
  Users,
  Activity,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

interface EditWorkspaceFormValues {
  name: string;
  description: string;
}

interface EditProjectFormValues {
  name: string;
  key: string;
  description: string;
}

export function ManagementDashboard() {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const mockUsers = useAppSelector((state) => state.auth.mockUsers);
  const workspaces = useAppSelector((state) => state.workspace.workspaces);
  const activeWorkspaceId = useAppSelector((state) => state.workspace.activeWorkspaceId);
  const projects = useAppSelector((state) => state.project.projects);
  const tasks = useAppSelector((state) => state.task.tasks);
  const activities = useAppSelector((state) => state.activity.activities);

  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<{ id: string; name: string } | null>(null);
  const [workspaceToDelete, setWorkspaceToDelete] = useState<{ id: string; name: string } | null>(null);

  const wsForm = useForm<EditWorkspaceFormValues>();
  const projForm = useForm<EditProjectFormValues>();

  const isOwnerOrAdmin = currentUser?.role === 'Owner' || currentUser?.role === 'Admin';

  const activeWorkspace =
    workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];

  const currentWorkspaceProjects = projects.filter(
    (p) => p.workspaceId === activeWorkspaceId
  );

  const currentWorkspaceTasks = tasks.filter(
    (t) => t.workspaceId === activeWorkspaceId
  );

  // High level metrics
  const totalTasks = currentWorkspaceTasks.length;
  const doneTasks = currentWorkspaceTasks.filter((t) => t.status === 'DONE').length;
  const inProgressTasks = currentWorkspaceTasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const overdueTasks = currentWorkspaceTasks.filter((t) => isOverdue(t.dueDate, t.status)).length;
  const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  // Workspace Edit Handler
  const handleOpenEditWorkspace = (ws: Workspace) => {
    setEditingWorkspace(ws);
    wsForm.reset({
      name: ws.name,
      description: ws.description || '',
    });
  };

  const handleSaveWorkspace = (data: EditWorkspaceFormValues) => {
    if (!editingWorkspace) return;
    dispatch(
      updateWorkspace({
        id: editingWorkspace.id,
        updates: {
          name: data.name.trim(),
          description: data.description.trim(),
        },
      })
    );
    toast.success(`Workspace "${data.name}" updated successfully.`);
    setEditingWorkspace(null);
  };

  // Workspace Delete Handler
  const handleDeleteWorkspaceConfirm = () => {
    if (workspaceToDelete) {
      if (workspaces.length <= 1) {
        toast.error('Cannot delete the only remaining workspace.');
        setWorkspaceToDelete(null);
        return;
      }
      dispatch(deleteWorkspace(workspaceToDelete.id));
      toast.success(`Workspace "${workspaceToDelete.name}" deleted successfully.`);
      setWorkspaceToDelete(null);
    }
  };

  // Project Edit Handler
  const handleOpenEditProject = (proj: Project) => {
    setEditingProject(proj);
    projForm.reset({
      name: proj.name,
      key: proj.key,
      description: proj.description || '',
    });
  };

  const handleSaveProject = (data: EditProjectFormValues) => {
    if (!editingProject) return;
    dispatch(
      updateProject({
        id: editingProject.id,
        updates: {
          name: data.name.trim(),
          key: data.key.trim().toUpperCase(),
          description: data.description.trim(),
        },
      })
    );
    toast.success(`Project "${data.name}" updated successfully.`);
    setEditingProject(null);
  };

  // Project Delete Handler
  const handleDeleteProjectConfirm = () => {
    if (projectToDelete) {
      dispatch(deleteProject(projectToDelete.id));
      toast.success(`Project "${projectToDelete.name}" deleted successfully.`);
      setProjectToDelete(null);
    }
  };

  // Role Management Handler (Owner/Admin only)
  const handleRoleChange = (userId: string, userName: string, newRole: UserRole) => {
    if (!isOwnerOrAdmin) {
      toast.error('Permission denied: Only Owner or Admin can change roles.');
      return;
    }
    dispatch(updateUserRole({ userId, newRole }));
    dispatch(updateMemberRole({ workspaceId: activeWorkspaceId, userId, role: newRole }));
    toast.success(`Updated ${userName}'s role to ${newRole}.`);
  };

  if (!isOwnerOrAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center max-w-md mx-auto space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center ring-1 ring-amber-500/20">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-[#1A1D26] dark:text-white">
          Access Restricted
        </h3>
        <p className="text-xs text-[#7D8592] dark:text-[#888888] leading-relaxed">
          The Executive Management Dashboard, workspace portfolio governance, and team role management are strictly reserved for Workspace Owners and Administrators.
        </p>
        <Button
          onClick={() => dispatch(setActiveView('kanban'))}
          className="bg-[#5D5FEF] hover:bg-[#4E50E6] text-white text-xs font-semibold px-4 h-9"
        >
          Return to Kanban Board
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Dashboard Top Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#5D5FEF] to-[#6C5DD3] p-6 sm:p-8 text-white shadow-xl shadow-indigo-500/15">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
            <span>Executive Portfolio Overview</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {currentUser?.name || 'Administrator'}
          </h2>
          <p className="mt-2 text-sm text-indigo-100 leading-relaxed">
            Monitor real-time pipeline velocity, manage team performance, and govern multi-workspace initiatives across {activeWorkspace?.name || 'your workspaces'}.
          </p>
        </div>
        <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* KPI Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tasks */}
        <div className="bg-white dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-[#222222] rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-[#7D8592] dark:text-[#888888] uppercase tracking-wider">
              Total Tasks
            </p>
            <h3 className="text-2xl font-extrabold text-[#1A1D26] dark:text-white mt-1">
              {totalTasks}
            </h3>
            <p className="text-xs text-[#5D5FEF] dark:text-indigo-400 font-medium mt-1">
              {inProgressTasks} currently in progress
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#ECEBFF] dark:bg-[#1A1A1A] text-[#5D5FEF] dark:text-indigo-400 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Completion Rate */}
        <div className="bg-white dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-[#222222] rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-[#7D8592] dark:text-[#888888] uppercase tracking-wider">
              Completion Rate
            </p>
            <h3 className="text-2xl font-extrabold text-[#1A1D26] dark:text-white mt-1">
              {completionRate}%
            </h3>
            <p className="text-xs text-[#0098DA] dark:text-[#00D2B4] font-medium mt-1">
              {doneTasks} completed items
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#E3F7FF] dark:bg-[#1A1A1A] text-[#0098DA] dark:text-[#00D2B4] flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Overdue Attention */}
        <div className="bg-white dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-[#222222] rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-[#7D8592] dark:text-[#888888] uppercase tracking-wider">
              Attention Needed
            </p>
            <h3 className="text-2xl font-extrabold text-[#1A1D26] dark:text-white mt-1">
              {overdueTasks}
            </h3>
            <p className="text-xs text-[#FF754C] font-medium mt-1">
              Overdue deadlines
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#FFEBF3] dark:bg-[#1A1A1A] text-[#FF754C] flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Projects & Workspaces */}
        <div className="bg-white dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-[#222222] rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-[#7D8592] dark:text-[#888888] uppercase tracking-wider">
              Active Projects
            </p>
            <h3 className="text-2xl font-extrabold text-[#1A1D26] dark:text-white mt-1">
              {currentWorkspaceProjects.length}
            </h3>
            <p className="text-xs text-[#6C5DD3] dark:text-purple-400 font-medium mt-1">
              Across {workspaces.length} workspace{workspaces.length > 1 ? 's' : ''}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#ECEBFF] dark:bg-[#1A1A1A] text-[#6C5DD3] dark:text-purple-400 flex items-center justify-center">
            <Folder className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Two Column Section: Project Delivery Pipelines + Workspace Portfolio */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Delivery Pipelines */}
        <div className="bg-white dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-[#222222] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#5D5FEF] dark:text-indigo-400" />
              <h3 className="font-bold text-sm text-[#1A1D26] dark:text-white uppercase tracking-wider">
                Project Delivery Pipelines
              </h3>
            </div>
            <span className="text-xs text-[#7D8592] dark:text-[#888888]">
              {currentWorkspaceProjects.length} active
            </span>
          </div>

          <div className="space-y-4">
            {currentWorkspaceProjects.length === 0 ? (
              <p className="text-xs text-[#7D8592] text-center py-6">
                No active projects found in this workspace.
              </p>
            ) : (
              currentWorkspaceProjects.map((proj) => {
                const pTasks = tasks.filter((t) => t.projectId === proj.id);
                const pDone = pTasks.filter((t) => t.status === 'DONE').length;
                const pProgress = pTasks.length > 0 ? Math.round((pDone / pTasks.length) * 100) : 0;
                const userCanEdit = canEditProject(currentUser?.role, proj, currentUser?.id);
                const userCanDelete = canDeleteProject(currentUser?.role, proj, currentUser?.id);

                return (
                  <div
                    key={proj.id}
                    className="p-4 rounded-xl border border-[#E5E7EB] dark:border-[#222222] bg-[#F6F7FB]/50 dark:bg-[#111111]/50 hover:border-[#5D5FEF]/40 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[#1A1D26] dark:text-white truncate">
                            {proj.name}
                          </span>
                          <Badge variant="outline" className="text-[10px] font-bold text-[#5D5FEF] border-[#5D5FEF]/30 dark:bg-[#1A1A1A] dark:text-indigo-400">
                            {proj.key}
                          </Badge>
                        </div>
                        {proj.description && (
                          <p className="text-xs text-[#7D8592] dark:text-[#888888] mt-0.5 line-clamp-1">
                            {proj.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {userCanEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEditProject(proj)}
                            className="h-7 w-7 text-[#7D8592] hover:text-[#5D5FEF] hover:bg-[#ECEBFF] dark:hover:bg-[#1A1A1A] rounded-lg"
                            title="Edit Project"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        {userCanDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setProjectToDelete({ id: proj.id, name: proj.name })}
                            className="h-7 w-7 text-[#7D8592] hover:text-[#FF754C] hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg"
                            title="Delete Project"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-[11px] mb-1 font-medium">
                        <span className="text-[#7D8592] dark:text-[#888888]">Completion</span>
                        <span className="text-[#1A1D26] dark:text-white font-bold">{pProgress}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#5D5FEF] transition-all duration-300"
                          style={{ width: `${pProgress}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-[11px] text-[#7D8592] dark:text-[#888888]">
                      <span>{pTasks.length} total tasks</span>
                      <span className="text-[#0098DA] dark:text-[#00D2B4] font-semibold">{pDone} completed</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Workspace Portfolio */}
        <div className="bg-white dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-[#222222] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#6C5DD3] dark:text-purple-400" />
              <h3 className="font-bold text-sm text-[#1A1D26] dark:text-white uppercase tracking-wider">
                Workspace Portfolio
              </h3>
            </div>
            <span className="text-xs text-[#7D8592] dark:text-[#888888]">
              {workspaces.length} total
            </span>
          </div>

          <div className="space-y-4">
            {workspaces.map((ws) => {
              const wsProjectCount = projects.filter((p) => p.workspaceId === ws.id).length;
              const wsTaskCount = tasks.filter((t) => t.workspaceId === ws.id).length;
              const userCanEdit = canEditWorkspace(currentUser?.role, ws, currentUser?.id);
              const userCanDelete = canDeleteWorkspace(currentUser?.role, ws, currentUser?.id);
              const isActive = ws.id === activeWorkspaceId;

              return (
                <div
                  key={ws.id}
                  className={`p-4 rounded-xl border transition-colors ${
                    isActive
                      ? 'border-[#5D5FEF] bg-[#ECEBFF]/30 dark:bg-[#5D5FEF]/10'
                      : 'border-[#E5E7EB] dark:border-[#222222] bg-[#F6F7FB]/50 dark:bg-[#111111]/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#1A1D26] dark:text-white truncate">
                          {ws.name}
                        </span>
                        {isActive && (
                          <Badge variant="secondary" className="text-[10px] bg-[#5D5FEF] text-white">
                            Current
                          </Badge>
                        )}
                      </div>
                      {ws.description && (
                        <p className="text-xs text-[#7D8592] dark:text-[#888888] mt-0.5 line-clamp-1">
                          {ws.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {userCanEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEditWorkspace(ws)}
                          className="h-7 w-7 text-[#7D8592] hover:text-[#5D5FEF] hover:bg-[#ECEBFF] dark:hover:bg-[#1A1A1A] rounded-lg"
                          title="Edit Workspace"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      {userCanDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={workspaces.length <= 1}
                          onClick={() => setWorkspaceToDelete({ id: ws.id, name: ws.name })}
                          className={`h-7 w-7 rounded-lg ${
                            workspaces.length <= 1
                              ? 'opacity-30 cursor-not-allowed text-[#7D8592]'
                              : 'text-[#7D8592] hover:text-[#FF754C] hover:bg-rose-50 dark:hover:bg-rose-950/30'
                          }`}
                          title={workspaces.length <= 1 ? 'Cannot delete only workspace' : 'Delete Workspace'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-[#E5E7EB] dark:border-[#222222] flex items-center justify-between text-xs text-[#7D8592] dark:text-[#888888]">
                    <span>{wsProjectCount} projects</span>
                    <span>{wsTaskCount} tasks</span>
                    <span>{ws.members?.length || 1} members</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Two Column Section: Team Directory + Recent Organization Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Directory (With Role Management for Owner/Admin only) */}
        <div className="bg-white dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-[#222222] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#5D5FEF] dark:text-indigo-400" />
              <h3 className="font-bold text-sm text-[#1A1D26] dark:text-white uppercase tracking-wider">
                Team Directory & Roles
              </h3>
            </div>
            <span className="text-xs text-[#7D8592] dark:text-[#888888]">
              {mockUsers.length} members
            </span>
          </div>

          <div className="divide-y divide-[#E5E7EB] dark:divide-[#222222]">
            {mockUsers.map((u) => (
              <div key={u.id} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="w-9 h-9 ring-1 ring-[#E5E7EB] dark:ring-[#222222] shrink-0">
                    <AvatarImage src={u.avatarUrl} alt={u.name} />
                    <AvatarFallback className="bg-[#5D5FEF] text-white text-xs font-bold">
                      {u.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#1A1D26] dark:text-white truncate">
                      {u.name} {currentUser?.id === u.id && <span className="text-[#5D5FEF] font-normal text-[10px]">(You)</span>}
                    </p>
                    <p className="text-[11px] text-[#7D8592] dark:text-[#888888] truncate">
                      {u.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isOwnerOrAdmin ? (
                    <Select
                      value={u.role}
                      onValueChange={(val) => handleRoleChange(u.id, u.name, val as UserRole)}
                    >
                      <SelectTrigger className="h-7 text-xs w-28 rounded-lg border-[#E5E7EB] dark:border-[#222222] bg-[#F6F7FB] dark:bg-[#111111] font-semibold text-[#5D5FEF] dark:text-white">
                        <SelectValue placeholder="Role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Owner">Owner</SelectItem>
                        <SelectItem value="Admin">Admin</SelectItem>
                        <SelectItem value="Member">Member</SelectItem>
                        <SelectItem value="Viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-[10px] font-bold text-[#5D5FEF] border-[#5D5FEF]/30 dark:bg-[#1A1A1A] dark:text-indigo-400"
                    >
                      {u.role}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Organization Activity */}
        <div className="bg-white dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-[#222222] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#FF754C]" />
              <h3 className="font-bold text-sm text-[#1A1D26] dark:text-white uppercase tracking-wider">
                Recent Organization Activity
              </h3>
            </div>
            <span className="text-xs text-[#7D8592] dark:text-[#888888]">
              Live event log
            </span>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {activities.length === 0 ? (
              <p className="text-xs text-[#7D8592] text-center py-6">
                No activity recorded yet.
              </p>
            ) : (
              activities.slice(0, 15).map((act) => {
                const actor = mockUsers.find((u) => u.id === act.userId);
                return (
                  <div
                    key={act.id}
                    className="p-3 rounded-xl border border-[#E5E7EB] dark:border-[#222222] bg-[#F6F7FB]/50 dark:bg-[#111111]/50 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 truncate">
                        <Avatar className="w-5 h-5 shrink-0">
                          <AvatarImage src={actor?.avatarUrl} />
                          <AvatarFallback className="text-[9px]">
                            {actor?.name?.slice(0, 1) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-semibold text-[#1A1D26] dark:text-white truncate">
                          {actor?.name || 'User'}
                        </span>
                        <span className="text-[#7D8592] dark:text-[#888888] truncate">
                          {act.action}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#7D8592] dark:text-[#888888] shrink-0">
                        {formatRelativeTime(act.timestamp)}
                      </span>
                    </div>
                    {act.details && (
                      <p className="mt-1 text-[11px] text-[#7D8592] dark:text-[#888888] line-clamp-2 pl-7">
                        {act.details}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Edit Workspace Dialog */}
      <Dialog
        open={!!editingWorkspace}
        onOpenChange={(open) => !open && setEditingWorkspace(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Workspace</DialogTitle>
            <DialogDescription>
              Update your workspace profile and details.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={wsForm.handleSubmit(handleSaveWorkspace)} className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-[#1A1D26] dark:text-slate-200">
                Workspace Name
              </label>
              <Input
                {...wsForm.register('name', { required: true })}
                className="mt-1 h-9 text-xs rounded-xl bg-[#F6F7FB] dark:bg-[#111111]"
                placeholder="Acme Corporation"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#1A1D26] dark:text-slate-200">
                Description
              </label>
              <Textarea
                {...wsForm.register('description')}
                rows={3}
                className="mt-1 text-xs rounded-xl bg-[#F6F7FB] dark:bg-[#111111]"
                placeholder="Brief description of this workspace..."
              />
            </div>
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingWorkspace(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#5D5FEF] hover:bg-[#4E50E6] text-white dark:bg-white dark:text-black"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Workspace Confirmation Alert Dialog */}
      <AlertDialog
        open={!!workspaceToDelete}
        onOpenChange={(open) => !open && setWorkspaceToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-rose-600">
              <ShieldAlert className="w-5 h-5" />
              Delete Workspace?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete &quot;{workspaceToDelete?.name}&quot;?
              All associated projects and tasks within this workspace will be deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteWorkspaceConfirm}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              Delete Workspace
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Project Dialog */}
      <Dialog
        open={!!editingProject}
        onOpenChange={(open) => !open && setEditingProject(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>
              Update project name, key prefix, and description.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={projForm.handleSubmit(handleSaveProject)} className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-[#1A1D26] dark:text-slate-200">
                Project Name
              </label>
              <Input
                {...projForm.register('name', { required: true })}
                className="mt-1 h-9 text-xs rounded-xl bg-[#F6F7FB] dark:bg-[#111111]"
                placeholder="Platform Modernization"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#1A1D26] dark:text-slate-200">
                Project Key
              </label>
              <Input
                {...projForm.register('key', { required: true })}
                className="mt-1 h-9 text-xs rounded-xl uppercase font-mono bg-[#F6F7FB] dark:bg-[#111111]"
                placeholder="ENG"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#1A1D26] dark:text-slate-200">
                Description
              </label>
              <Textarea
                {...projForm.register('description')}
                rows={3}
                className="mt-1 text-xs rounded-xl bg-[#F6F7FB] dark:bg-[#111111]"
                placeholder="Project goals and delivery scope..."
              />
            </div>
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingProject(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#5D5FEF] hover:bg-[#4E50E6] text-white dark:bg-white dark:text-black"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Project Confirmation Alert Dialog */}
      <AlertDialog
        open={!!projectToDelete}
        onOpenChange={(open) => !open && setProjectToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-rose-600">
              <ShieldAlert className="w-5 h-5" />
              Delete Project?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete the project &quot;{projectToDelete?.name}&quot;?
              This action cannot be undone.
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
    </div>
  );
}
