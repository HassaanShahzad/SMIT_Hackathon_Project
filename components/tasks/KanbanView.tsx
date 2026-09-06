'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { useAppDispatch, useAppSelector } from '@/store';
import { moveTaskStatus, restoreTask, deleteTask } from '@/store/slices/taskSlice';
import { openTaskDetail, setCreateTaskOpen } from '@/store/slices/uiSlice';
import { logActivity } from '@/store/slices/activitySlice';
import { Task, TaskPriority, TaskStatus } from '@/types/task';
import { canEditTask, canCreateTask } from '@/lib/permissions';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { formatDate, isOverdue } from '@/lib/utils';
import {
  Plus,
  Calendar,
  CheckCircle2,
  Paperclip,
  MoreHorizontal,
  Flame,
  Clock,
  Layers,
  Sparkles,
} from 'lucide-react';

const COLUMNS: {
  id: TaskStatus;
  title: string;
  color: string;
  badgeBg: string;
  dotColor: string;
}[] = [
  {
    id: 'BACKLOG',
    title: 'Backlog',
    color: 'border-[#E5E7EB] dark:border-[#222222]',
    badgeBg: 'bg-[#F6F7FB] dark:bg-[#111111] text-[#7D8592] dark:text-[#888888]',
    dotColor: 'bg-slate-500',
  },
  {
    id: 'TODO',
    title: 'To Do',
    color: 'border-indigo-500/30',
    badgeBg: 'bg-indigo-500/15 text-indigo-400',
    dotColor: 'bg-indigo-500',
  },
  {
    id: 'IN_PROGRESS',
    title: 'In Progress',
    color: 'border-amber-500/30',
    badgeBg: 'bg-amber-500/15 text-amber-400',
    dotColor: 'bg-amber-500',
  },
  {
    id: 'DONE',
    title: 'Done',
    color: 'border-emerald-500/30',
    badgeBg: 'bg-emerald-500/15 text-emerald-400',
    dotColor: 'bg-emerald-500',
  },
];

interface KanbanViewProps {
  filteredTasks: Task[];
}

export function KanbanView({ filteredTasks }: KanbanViewProps) {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const mockUsers = useAppSelector((state) => state.auth.mockUsers);
  const projects = useAppSelector((state) => state.project.projects);
  const activeProjectId = useAppSelector((state) => state.project.activeProjectId);
  const subtasks = useAppSelector((state) => state.subtask.subtasks);

  const activeProject = projects.find((p) => p.id === activeProjectId);

  // Active columns (Project-specific custom columns or standard default columns)
  const activeColumns =
    activeProject?.customColumns && activeProject.customColumns.length > 0
      ? activeProject.customColumns.map((col) => ({
          id: col.id as TaskStatus,
          title: col.title,
          color: 'border-purple-500/30',
          badgeBg: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
          dotColor: col.color || 'bg-purple-500',
        }))
      : COLUMNS;

  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  const userCanEdit = canEditTask(currentUser?.role);

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    const task = filteredTasks.find((t) => t.id === taskId);
    if (!canEditTask(currentUser?.role, task, currentUser?.id)) {
      e.preventDefault();
      toast.error('Permission denied: You can only move tasks you created yourself.');
      return;
    }
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e: React.DragEvent, columnId: TaskStatus) => {
    e.preventDefault();
    if (dragOverColumn !== columnId) {
      setDragOverColumn(columnId);
    }
  };

  const handleDrop = (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (!taskId) return;

    const task = filteredTasks.find((t) => t.id === taskId);
    if (task && task.status !== targetStatus) {
      if (!canEditTask(currentUser?.role, task, currentUser?.id)) {
        toast.error('Permission denied: You can only move tasks you created yourself.');
        setDraggedTaskId(null);
        return;
      }
      dispatch(moveTaskStatus({ id: taskId, newStatus: targetStatus }));
      dispatch(
        logActivity({
          workspaceId: task.workspaceId,
          projectId: task.projectId,
          taskId: task.id,
          userId: currentUser?.id || 'sys',
          action: 'moved task',
          details: `Moved from ${task.status} to ${targetStatus}`,
        })
      );
      toast.success(`Task moved to ${targetStatus.replace('_', ' ')}`);
    }
    setDraggedTaskId(null);
  };

  return (
    <div
      className="grid gap-4 pb-8 items-start overflow-x-auto"
      style={{
        gridTemplateColumns: `repeat(${activeColumns.length}, minmax(280px, 1fr))`,
      }}
    >
      {activeColumns.map((column) => {
        const columnTasks = filteredTasks.filter((t) => t.status === column.id);
        const isTarget = dragOverColumn === column.id;

        return (
          <div
            key={column.id}
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDrop={(e) => handleDrop(e, column.id)}
            className={`flex flex-col rounded-2xl border bg-white dark:bg-[#0A0A0A] transition-all duration-200 min-h-[520px] shadow-sm ${
              isTarget
                ? 'border-[#5D5FEF] bg-[#ECEBFF]/20 ring-2 ring-[#5D5FEF]/20'
                : 'border-[#E5E7EB] dark:border-[#222222]'
            }`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between p-3.5 border-b border-[#E5E7EB] dark:border-[#222222]">
              <div className="flex items-center space-x-2">
                <span className={`w-2.5 h-2.5 rounded-full ${column.dotColor}`} />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#1A1D26] dark:text-white">
                  {column.title}
                </h3>
                <span className="rounded-full bg-[#F6F7FB] dark:bg-[#1A1A1A] px-2 py-0.5 text-[11px] font-mono text-[#7D8592] dark:text-[#888888] font-bold border border-[#E5E7EB] dark:border-[#222222]">
                  {columnTasks.length}
                </span>
              </div>

              {canCreateTask(currentUser?.role) && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-[#9C9FA6] hover:text-[#B66DFF] hover:bg-[#B66DFF]/10"
                  onClick={() =>
                    dispatch(setCreateTaskOpen({ open: true, defaultStatus: column.id }))
                  }
                  title={`Add task in ${column.title}`}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            {/* Task Cards Stack */}
            <div className="flex-1 p-2.5 space-y-2.5 overflow-y-auto max-h-[calc(100vh-280px)]">
              {columnTasks.map((task) => {
                const project = projects.find((p) => p.id === task.projectId);
                const assignee = mockUsers.find((u) => u.id === task.assigneeId);
                const taskSubtasks = subtasks.filter((s) => s.taskId === task.id);
                const completedSubs = taskSubtasks.filter((s) => s.completed).length;
                const overdue = isOverdue(task.dueDate, task.status);
                const taskCanEdit = canEditTask(currentUser?.role, task, currentUser?.id);

                return (
                  <div
                    key={task.id}
                    draggable={taskCanEdit}
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onClick={() => dispatch(openTaskDetail(task.id))}
                    className={`group relative rounded-xl border border-[#E5E7EB] dark:border-[#222222] bg-[#F6F7FB]/60 dark:bg-[#111111] p-3.5 shadow-sm transition-all duration-150 hover:border-[#5D5FEF]/40 hover:shadow-md cursor-pointer select-none ${
                      draggedTaskId === task.id ? 'opacity-40 scale-95' : ''
                    }`}
                  >
                    {/* Top row: Key & Priority */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono font-bold text-[#7D8592] dark:text-[#888888] group-hover:text-[#5D5FEF] transition-colors">
                        {project?.key || 'TASK'}-{task.taskNumber}
                      </span>

                      <Badge
                        variant={
                          task.priority === 'URGENT'
                            ? 'destructive'
                            : task.priority === 'HIGH'
                            ? 'warning'
                            : task.priority === 'MEDIUM'
                            ? 'default'
                            : 'secondary'
                        }
                        className="text-[10px] px-1.5 py-0 font-semibold"
                      >
                        {task.priority === 'URGENT' && <Flame className="w-2.5 h-2.5 mr-0.5 inline text-white" />}
                        {task.priority}
                      </Badge>
                    </div>

                    {/* Title */}
                    <h4 className="text-xs font-semibold text-[#1A1D26] dark:text-[#EDEDED] line-clamp-2 leading-relaxed mb-2 group-hover:text-[#5D5FEF] transition-colors">
                      {task.title}
                    </h4>

                    {/* Labels */}
                    {task.labels.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {task.labels.slice(0, 3).map((lbl) => (
                          <span
                            key={lbl}
                            className="text-[10px] bg-[#ECEBFF] dark:bg-[#1A1A1A] text-[#5D5FEF] dark:text-indigo-400 px-1.5 py-0.5 rounded font-medium border border-[#5D5FEF]/20"
                          >
                            {lbl}
                          </span>
                        ))}
                        {task.labels.length > 3 && (
                          <span className="text-[10px] text-[#7D8592] dark:text-[#888888] font-medium">
                            +{task.labels.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Footer: Due date, Subtasks, Assignee */}
                    <div className="flex items-center justify-between pt-2 border-t border-[#E5E7EB] dark:border-[#222222]">
                      <div className="flex items-center space-x-2.5 text-[11px]">
                        {/* Due date */}
                        {task.dueDate && (
                          <div
                            className={`flex items-center space-x-1 font-medium ${
                              overdue
                                ? 'text-[#FE7C96] font-bold'
                                : 'text-[#9C9FA6]'
                            }`}
                            title={overdue ? 'Task is overdue!' : 'Due date'}
                          >
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(task.dueDate)}</span>
                          </div>
                        )}

                        {/* Subtasks Count */}
                        {taskSubtasks.length > 0 && (
                          <div className="flex items-center space-x-1 text-[#9C9FA6] font-medium">
                            <CheckCircle2 className="w-3 h-3 text-[#1BD9B2]" />
                            <span>
                              {completedSubs}/{taskSubtasks.length}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Assignee Avatar */}
                      <UserAvatar
                        name={assignee?.name || 'Unassigned'}
                        avatarUrl={assignee?.avatarUrl}
                        size="sm"
                      />
                    </div>
                  </div>
                );
              })}

              {columnTasks.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center border border-dashed border-[#E5E7EB] dark:border-[#222222] rounded-xl bg-white/40 dark:bg-[#111111]/40">
                  <p className="text-xs text-[#7D8592] dark:text-[#888888] font-medium">No tasks in {column.title}</p>
                  {userCanEdit && (
                    <button
                      onClick={() =>
                        dispatch(setCreateTaskOpen({ open: true, defaultStatus: column.id }))
                      }
                      className="mt-2 text-xs text-[#5D5FEF] hover:underline font-semibold"
                    >
                      + Add task
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Column Footer Quick Add */}
            {userCanEdit && (
              <div className="p-2 border-t border-[#E5E7EB] dark:border-[#222222]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-[#9C9FA6] hover:text-[#343A40] dark:hover:text-white justify-start h-8 font-medium"
                  onClick={() =>
                    dispatch(setCreateTaskOpen({ open: true, defaultStatus: column.id }))
                  }
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5 text-[#B66DFF]" /> Add Task
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
