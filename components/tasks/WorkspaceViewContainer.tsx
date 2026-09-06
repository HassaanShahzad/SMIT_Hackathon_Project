'use client';

import React, { useMemo, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { TaskFilterBar } from '@/components/tasks/TaskFilterBar';
import { KanbanView } from '@/components/tasks/KanbanView';
import { ListView } from '@/components/tasks/ListView';
import { CalendarView } from '@/components/tasks/CalendarView';
import { Button } from '@/components/ui/button';
import {
  setCreateTaskOpen,
  setCreateProjectOpen,
  setSettingsOpen,
  setActiveView,
  ActiveView,
} from '@/store/slices/uiSlice';
import { setActiveProject } from '@/store/slices/projectSlice';
import { canCreateTask } from '@/lib/permissions';
import { isOverdue } from '@/lib/utils';
import { Plus, Settings, Inbox } from 'lucide-react';

interface WorkspaceViewContainerProps {
  currentView?: ActiveView;
}

export function WorkspaceViewContainer({ currentView }: WorkspaceViewContainerProps) {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const activeView = useAppSelector((state) => state.ui.activeView);
  const activeWorkspaceId = useAppSelector((state) => state.workspace.activeWorkspaceId);
  const workspaces = useAppSelector((state) => state.workspace.workspaces);
  const projects = useAppSelector((state) => state.project.projects);
  const activeProjectId = useAppSelector((state) => state.project.activeProjectId);
  const tasks = useAppSelector((state) => state.task.tasks);
  const filter = useAppSelector((state) => state.filter);

  useEffect(() => {
    if (currentView && currentView !== activeView) {
      dispatch(setActiveView(currentView));
    }
  }, [currentView, activeView, dispatch]);

  const visibleWorkspaces = useMemo(() => {
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
  const activeProject = projects.find((p) => p.id === activeProjectId && p.workspaceId === currentWorkspaceId);

  // Filter and sort the tasks for the current workspace and project
  const filteredTasks = useMemo(() => {
    let result = tasks.filter((t) => t.workspaceId === currentWorkspaceId);

    // Filter by project if activeProjectId is selected
    if (activeProjectId) {
      result = result.filter((t) => t.projectId === activeProjectId);
    }

    // Search query filter
    if (filter.searchQuery.trim()) {
      const q = filter.searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.labels.some((l) => l.toLowerCase().includes(q))
      );
    }

    // Status filter
    if (filter.selectedStatuses.length > 0) {
      result = result.filter((t) => filter.selectedStatuses.includes(t.status));
    }

    // Priority filter
    if (filter.selectedPriorities.length > 0) {
      result = result.filter((t) => filter.selectedPriorities.includes(t.priority));
    }

    // Assignee filter
    if (filter.selectedAssigneeId) {
      result = result.filter((t) => t.assigneeId === filter.selectedAssigneeId);
    }

    // Label filter
    if (filter.selectedLabel) {
      result = result.filter((t) => t.labels.includes(filter.selectedLabel!));
    }

    // Only my tasks filter
    if (filter.onlyMyTasks && currentUser) {
      result = result.filter((t) => t.assigneeId === currentUser.id);
    }

    // Due date filter
    if (filter.dueDateFilter !== 'all') {
      const now = new Date();
      const todayStr = now.toISOString().slice(0, 10);

      // Start & end of this week
      const day = now.getDay();
      const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1);
      const startOfWeek = new Date(now.setDate(diffToMonday));
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);

      result = result.filter((t) => {
        if (!t.dueDate) return filter.dueDateFilter === 'no_date';
        const taskDateStr = t.dueDate.slice(0, 10);
        const taskDate = new Date(t.dueDate);

        if (filter.dueDateFilter === 'today') {
          return taskDateStr === todayStr;
        }
        if (filter.dueDateFilter === 'this_week') {
          return taskDate >= startOfWeek && taskDate <= endOfWeek;
        }
        if (filter.dueDateFilter === 'overdue') {
          return isOverdue(t.dueDate, t.status);
        }
        return true;
      });
    }

    // Sorting
    result = [...result].sort((a, b) => {
      let comparison = 0;
      if (filter.sortField === 'dueDate') {
        const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        comparison = dateA - dateB;
      } else if (filter.sortField === 'priority') {
        const priorityWeight = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        comparison = priorityWeight[a.priority] - priorityWeight[b.priority];
      } else if (filter.sortField === 'title') {
        comparison = a.title.localeCompare(b.title);
      } else {
        // createdAt
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }

      return filter.sortDirection === 'desc' ? -comparison : comparison;
    });

    return result;
  }, [tasks, currentWorkspaceId, activeProjectId, filter, currentUser]);

  const userCanCreate = canCreateTask(currentUser?.role);
  const effectiveView = currentView || activeView;

  return (
    <div className="space-y-5">
      {/* Workspace & Project Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#EBEDF2] dark:border-slate-800/80">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#B66DFF] font-mono">
              {activeWorkspace?.name || 'Workspace'}
            </span>
            <span className="text-[#9C9FA6]">/</span>
            {activeProject ? (
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-semibold text-[#343A40] dark:text-slate-300">
                  [{activeProject.key}] {activeProject.name}
                </span>
                <button
                  onClick={() => dispatch(setActiveProject(null))}
                  className="text-[10px] text-[#B66DFF] hover:underline ml-1 font-medium"
                >
                  View All
                </button>
              </div>
            ) : (
              <span className="text-xs font-medium text-[#9C9FA6]">All Projects</span>
            )}
          </div>

          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#343A40] dark:text-slate-100">
            {activeProject ? activeProject.name : `${activeWorkspace?.name || 'Workspace'} Overview`}
          </h1>
          <p className="text-xs text-[#9C9FA6] mt-0.5 line-clamp-1">
            {activeProject?.description ||
              activeWorkspace?.description ||
              'Collaborative issue tracking, sprint milestones, and productivity hub.'}
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center space-x-2 shrink-0">
          {userCanCreate && (
            <Button
              onClick={() =>
                dispatch(setCreateTaskOpen({ open: true, defaultStatus: 'TODO' }))
              }
              className="h-8 text-xs font-medium bg-gradient-to-r from-[#DA8CFF] to-[#9A55FF] text-white hover:opacity-95 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Create Task
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => dispatch(setSettingsOpen(true))}
            className="h-8 text-xs border-[#EBEDF2] dark:border-slate-800 text-[#343A40] dark:text-slate-300"
          >
            <Settings className="w-3.5 h-3.5 mr-1 text-[#9C9FA6]" /> Settings
          </Button>
        </div>
      </div>

      {/* Search, Filter & Preset Ribbon */}
      <TaskFilterBar />

      {/* Modality View Switching */}
      {effectiveView === 'kanban' && <KanbanView filteredTasks={filteredTasks} />}
      {effectiveView === 'list' && <ListView filteredTasks={filteredTasks} />}
      {effectiveView === 'calendar' && <CalendarView filteredTasks={filteredTasks} />}

      {/* Global Empty Workspace Prompt */}
      {filteredTasks.length === 0 && tasks.filter((t) => t.workspaceId === currentWorkspaceId).length === 0 && (
        <div className="flex flex-col items-center justify-center p-12 border border-dashed border-[#EBEDF2] dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/20 text-center shadow-xs">
          <Inbox className="w-10 h-10 text-[#9C9FA6] mb-3" />
          <h3 className="text-base font-bold text-[#343A40] dark:text-slate-200">No tasks in this workspace yet</h3>
          <p className="text-xs text-[#9C9FA6] max-w-sm mt-1 mb-4">
            Get started by creating your first task or project using the buttons below.
          </p>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              className="bg-gradient-to-r from-[#DA8CFF] to-[#9A55FF] text-white"
              onClick={() =>
                dispatch(setCreateTaskOpen({ open: true, defaultStatus: 'TODO' }))
              }
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Create First Task
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-[#EBEDF2] text-[#343A40]"
              onClick={() => dispatch(setCreateProjectOpen(true))}
            >
              Create Project
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
