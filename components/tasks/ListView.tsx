'use client';

import React from 'react';
import { toast } from 'sonner';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  updateTask,
  deleteTask,
  restoreTask,
  toggleSelectTask,
  selectAllTasks,
  clearSelectedTasks,
  bulkUpdateStatus,
  bulkUpdatePriority,
  bulkDeleteTasks,
} from '@/store/slices/taskSlice';
import { openTaskDetail } from '@/store/slices/uiSlice';
import { logActivity } from '@/store/slices/activitySlice';
import { addNotification } from '@/store/slices/notificationSlice';
import { Task, TaskPriority, TaskStatus } from '@/types/task';
import { canEditTask, canDeleteTask } from '@/lib/permissions';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { formatDate, isOverdue } from '@/lib/utils';
import {
  Calendar,
  CheckCircle2,
  ChevronDown,
  Trash2,
  X,
  Flame,
  CheckSquare,
  Eye,
  Pencil,
  Layers,
} from 'lucide-react';

interface ListViewProps {
  filteredTasks: Task[];
}

export function ListView({ filteredTasks }: ListViewProps) {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const mockUsers = useAppSelector((state) => state.auth.mockUsers);
  const projects = useAppSelector((state) => state.project.projects);
  const subtasks = useAppSelector((state) => state.subtask.subtasks);
  const selectedTaskIds = useAppSelector((state) => state.task.selectedTaskIds);
  const groupBy = useAppSelector((state) => state.filter.groupBy);

  const isAllSelected =
    filteredTasks.length > 0 &&
    filteredTasks.every((t) => selectedTaskIds.includes(t.id));

  const handleSelectAll = () => {
    if (isAllSelected) {
      dispatch(clearSelectedTasks());
    } else {
      dispatch(selectAllTasks(filteredTasks.map((t) => t.id)));
    }
  };

  const handleBulkStatus = (status: TaskStatus) => {
    if (!currentUser || currentUser.role === 'Viewer') {
      toast.error('Permission denied: Viewers cannot update tasks.');
      return;
    }
    const selectedTasks = filteredTasks.filter((t) => selectedTaskIds.includes(t.id));
    const unauthorized = selectedTasks.some((t) => !canEditTask(currentUser.role, t, currentUser.id));
    if (unauthorized) {
      toast.error('Permission denied: You can only update tasks you created yourself.');
      return;
    }
    dispatch(bulkUpdateStatus({ status }));
    toast.success(`Updated ${selectedTaskIds.length} tasks to ${status}`);
  };

  const handleBulkPriority = (priority: TaskPriority) => {
    if (!currentUser || currentUser.role === 'Viewer') {
      toast.error('Permission denied: Viewers cannot update tasks.');
      return;
    }
    const selectedTasks = filteredTasks.filter((t) => selectedTaskIds.includes(t.id));
    const unauthorized = selectedTasks.some((t) => !canEditTask(currentUser.role, t, currentUser.id));
    if (unauthorized) {
      toast.error('Permission denied: You can only update tasks you created yourself.');
      return;
    }
    dispatch(bulkUpdatePriority({ priority }));
    toast.success(`Updated ${selectedTaskIds.length} tasks to ${priority}`);
  };

  const handleBulkDelete = () => {
    if (!currentUser || currentUser.role === 'Viewer') {
      toast.error('Permission denied: Viewers cannot delete tasks.');
      return;
    }
    const selectedTasks = filteredTasks.filter((t) => selectedTaskIds.includes(t.id));
    const unauthorized = selectedTasks.some((t) => !canDeleteTask(currentUser.role, t, currentUser.id));
    if (unauthorized) {
      toast.error('Permission denied: You can only delete tasks you created yourself.');
      return;
    }
    const count = selectedTaskIds.length;
    dispatch(bulkDeleteTasks());
    toast.success(`Deleted ${count} tasks`);
  };

  const handleDeleteTask = (task: Task) => {
    if (!canDeleteTask(currentUser?.role, task, currentUser?.id)) {
      toast.error('Permission denied: You can only delete tasks you created yourself.');
      return;
    }
    dispatch(deleteTask(task.id));
    dispatch(
      logActivity({
        workspaceId: task.workspaceId,
        projectId: task.projectId,
        taskId: task.id,
        userId: currentUser?.id || 'sys',
        action: 'deleted task',
        details: `Deleted task "${task.title}"`,
      })
    );

    toast('Task deleted', {
      description: `"${task.title}" was moved to trash.`,
      action: {
        label: 'Undo',
        onClick: () => {
          dispatch(restoreTask(task));
          toast.success('Task restored successfully!');
        },
      },
    });
  };

  // Render row component
  const renderTaskRow = (task: Task) => {
    const project = projects.find((p) => p.id === task.projectId);
    const assignee = mockUsers.find((u) => u.id === task.assigneeId);
    const taskSubtasks = subtasks.filter((s) => s.taskId === task.id);
    const completedSubs = taskSubtasks.filter((s) => s.completed).length;
    const overdue = isOverdue(task.dueDate, task.status);
    const isSelected = selectedTaskIds.includes(task.id);
    const userCanEdit = canEditTask(currentUser?.role, task, currentUser?.id);
    const userCanDelete = canDeleteTask(currentUser?.role, task, currentUser?.id);

    return (
      <tr
        key={task.id}
        className={`group transition-colors hover:bg-[#F2EDF3]/40 dark:hover:bg-slate-850/40 cursor-pointer ${
          isSelected ? 'bg-[#B66DFF]/10' : ''
        }`}
      >
        {/* Selection Checkbox */}
        <td className="py-3 px-4 w-10" onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => dispatch(toggleSelectTask(task.id))}
          />
        </td>

        {/* Ticket Key */}
        <td
          className="py-3 px-3 font-mono font-bold text-[#B66DFF] whitespace-nowrap w-24"
          onClick={() => dispatch(openTaskDetail(task.id))}
        >
          {project?.key || 'TASK'}-{task.taskNumber}
        </td>

        {/* Title & Labels */}
        <td className="py-3 px-3" onClick={() => dispatch(openTaskDetail(task.id))}>
          <div className="font-bold text-[#343A40] dark:text-white line-clamp-1 group-hover:text-[#B66DFF] transition-colors">
            {task.title}
          </div>
          {task.labels.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {task.labels.map((lbl) => (
                <span
                  key={lbl}
                  className="text-[10px] bg-[#ECEBFF] dark:bg-[#1A1A1A] text-[#5D5FEF] dark:text-indigo-400 px-1.5 py-0.5 rounded font-medium border border-[#5D5FEF]/20"
                >
                  {lbl}
                </span>
              ))}
            </div>
          )}
        </td>

        {/* Status Dropdown */}
        <td className="py-3 px-3 w-36" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild disabled={!userCanEdit}>
              <button
                type="button"
                className="inline-flex items-center space-x-1.5 text-xs rounded-xl px-2.5 py-1 bg-white dark:bg-[#111111] border border-[#F0F1F5] dark:border-[#222222] hover:bg-[#F6F7FB] dark:hover:bg-[#1A1A1A] transition-colors shadow-sm text-[#1A1D26] dark:text-[#EDEDED]"
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    task.status === 'DONE'
                      ? 'bg-[#1BD9B2]'
                      : task.status === 'IN_PROGRESS'
                      ? 'bg-amber-500'
                      : task.status === 'TODO'
                      ? 'bg-[#B66DFF]'
                      : 'bg-[#9C9FA6]'
                  }`}
                />
                <span className="font-semibold">{task.status.replace('_', ' ')}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="border-[#F0F1F5] dark:border-[#222222] bg-white dark:bg-[#0A0A0A]">
              <DropdownMenuItem
                onClick={() =>
                  dispatch(updateTask({ id: task.id, updates: { status: 'BACKLOG' } }))
                }
              >
                Backlog
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  dispatch(updateTask({ id: task.id, updates: { status: 'TODO' } }))
                }
              >
                To Do
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  dispatch(updateTask({ id: task.id, updates: { status: 'IN_PROGRESS' } }))
                }
              >
                In Progress
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  dispatch(updateTask({ id: task.id, updates: { status: 'DONE' } }))
                }
              >
                Done
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </td>

        {/* Priority Badge */}
        <td className="py-3 px-3 w-28" onClick={(e) => e.stopPropagation()}>
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
            className="text-[10px] font-semibold"
          >
            {task.priority === 'URGENT' && <Flame className="w-2.5 h-2.5 mr-1 text-white" />}
            {task.priority}
          </Badge>
        </td>

        {/* Assignee */}
        <td className="py-3 px-3 w-36" onClick={() => dispatch(openTaskDetail(task.id))}>
          <div className="flex items-center space-x-2">
            <UserAvatar name={assignee?.name} avatarUrl={assignee?.avatarUrl} size="sm" />
            <span className="truncate max-w-[100px] text-[#343A40] dark:text-slate-300 font-medium">
              {assignee?.name || 'Unassigned'}
            </span>
          </div>
        </td>

        {/* Due Date */}
        <td className="py-3 px-3 w-32" onClick={() => dispatch(openTaskDetail(task.id))}>
          {task.dueDate ? (
            <div
              className={`flex items-center space-x-1.5 ${
                overdue ? 'text-[#FE7C96] font-bold' : 'text-[#9C9FA6]'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatDate(task.dueDate)}</span>
            </div>
          ) : (
            <span className="text-[#9C9FA6]">—</span>
          )}
        </td>

        {/* Action Buttons: View (Eye), Edit (Pencil), Delete (Trash2) */}
        <td className="py-3 px-3 text-right pr-4 space-x-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-[#9C9FA6] hover:text-[#B66DFF] hover:bg-[#B66DFF]/10"
            onClick={() => dispatch(openTaskDetail(task.id))}
            title="View Task Details"
          >
            <Eye className="w-3.5 h-3.5" />
          </Button>

          {userCanEdit && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-[#9C9FA6] hover:text-[#B66DFF] hover:bg-[#B66DFF]/10"
              onClick={() => dispatch(openTaskDetail(task.id))}
              title="Edit Task"
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
          )}

          {userCanDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-[#9C9FA6] hover:text-[#FE7C96] hover:bg-[#FE7C96]/10"
                  title="Delete Task"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Task?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete &quot;{task.title}&quot;?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDeleteTask(task)}
                    className="bg-[#FE7C96] hover:bg-[#FE7C96]/90 text-white"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </td>
      </tr>
    );
  };

  // Section 18: Group By Status logic
  const statusGroups: { id: TaskStatus; label: string; color: string }[] = [
    { id: 'TODO', label: 'To Do', color: 'bg-purple-600' },
    { id: 'IN_PROGRESS', label: 'In Progress', color: 'bg-amber-500' },
    { id: 'DONE', label: 'Done', color: 'bg-emerald-500' },
    { id: 'BACKLOG', label: 'Backlog', color: 'bg-slate-400' },
  ];

  return (
    <div className="space-y-3 pb-8">
      {/* Floating Bulk Actions Bar (Section 28) */}
      {selectedTaskIds.length > 0 && (
        <div className="sticky top-14 z-20 flex items-center justify-between p-3 rounded-2xl border border-[#B66DFF]/40 bg-white/95 dark:bg-slate-900/95 shadow-xl backdrop-blur-md">
          <div className="flex items-center space-x-2 text-xs text-[#343A40] dark:text-purple-300 font-bold">
            <CheckSquare className="w-4 h-4 text-[#B66DFF]" />
            <span>
              {selectedTaskIds.length} task{selectedTaskIds.length > 1 ? 's' : ''} selected
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {/* Bulk Status Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 text-xs font-semibold border-[#EBEDF2] dark:border-slate-800">
                  Change Status <ChevronDown className="ml-1 h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="border-[#EBEDF2] dark:border-slate-800 bg-white dark:bg-[#0F172A]">
                <DropdownMenuItem onClick={() => handleBulkStatus('TODO')}>To Do</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkStatus('IN_PROGRESS')}>In Progress</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkStatus('DONE')}>Done</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkStatus('BACKLOG')}>Backlog</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Bulk Priority Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 text-xs font-semibold border-[#EBEDF2] dark:border-slate-800">
                  Change Priority <ChevronDown className="ml-1 h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="border-[#EBEDF2] dark:border-slate-800 bg-white dark:bg-[#0F172A]">
                <DropdownMenuItem onClick={() => handleBulkPriority('LOW')}>Low</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkPriority('MEDIUM')}>Medium</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkPriority('HIGH')}>High</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkPriority('URGENT')}>Urgent</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Bulk Delete */}
            <Button
              variant="destructive"
              size="sm"
              className="h-7 text-xs font-semibold bg-[#FE7C96] hover:bg-[#FE7C96]/90 text-white"
              onClick={handleBulkDelete}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-[#9C9FA6] hover:text-[#343A40] dark:hover:text-white"
              onClick={() => dispatch(clearSelectedTasks())}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Main Table View (Grouped or Flat) */}
      <div className="rounded-2xl border border-[#F0F1F5] dark:border-[#222222] bg-white dark:bg-[#0A0A0A] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#F0F1F5] dark:border-[#222222] bg-[#F6F7FB] dark:bg-[#111111] text-[11px] font-bold uppercase tracking-wider text-[#7D8592] dark:text-[#888888]">
                <th className="py-3 px-4 w-10">
                  <Checkbox checked={isAllSelected} onCheckedChange={handleSelectAll} />
                </th>
                <th className="py-3 px-3 w-24">Ticket</th>
                <th className="py-3 px-3">Title & Labels</th>
                <th className="py-3 px-3 w-36">Status</th>
                <th className="py-3 px-3 w-28">Priority</th>
                <th className="py-3 px-3 w-36">Assignee</th>
                <th className="py-3 px-3 w-32">Due Date</th>
                <th className="py-3 px-3 w-28 text-right pr-4">Actions</th>
              </tr>
            </thead>

            {/* Group by Status display */}
            {groupBy === 'status' ? (
              <tbody className="divide-y divide-[#F0F1F5] dark:divide-[#222222] text-xs">
                {statusGroups.map((group) => {
                  const groupTasks = filteredTasks.filter((t) => t.status === group.id);
                  if (groupTasks.length === 0) return null;

                  return (
                    <React.Fragment key={group.id}>
                      <tr className="bg-[#F2EDF3]/40 dark:bg-slate-900/80">
                        <td colSpan={8} className="py-2.5 px-4 font-bold text-[#343A40] dark:text-slate-200">
                          <div className="flex items-center space-x-2">
                            <span className={`w-2 h-2 rounded-full ${group.color}`} />
                            <span className="uppercase tracking-wider text-[11px] font-bold">{group.label}</span>
                            <span className="text-[10px] text-[#9C9FA6] font-normal">
                              ({groupTasks.length} tasks)
                            </span>
                          </div>
                        </td>
                      </tr>
                      {groupTasks.map((task) => renderTaskRow(task))}
                    </React.Fragment>
                  );
                })}

                {filteredTasks.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-xs text-[#9C9FA6]">
                      No matching tasks found.
                    </td>
                  </tr>
                )}
              </tbody>
            ) : (
              /* Flat Table View */
              <tbody className="divide-y divide-[#EBEDF2] dark:divide-slate-800 text-xs">
                {filteredTasks.map((task) => renderTaskRow(task))}
                {filteredTasks.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-xs text-[#9C9FA6]">
                      No matching tasks found.
                    </td>
                  </tr>
                )}
              </tbody>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
