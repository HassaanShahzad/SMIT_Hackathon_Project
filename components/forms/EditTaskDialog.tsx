'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAppDispatch, useAppSelector } from '@/store';
import { updateTask } from '@/store/slices/taskSlice';
import { setEditTaskOpen } from '@/store/slices/uiSlice';
import { logActivity } from '@/store/slices/activitySlice';
import { addNotification } from '@/store/slices/notificationSlice';
import { TaskFormValues, TaskPriority, TaskStatus } from '@/types/task';
import { canEditTask } from '@/lib/permissions';
import { Pencil, Plus, X } from 'lucide-react';

const COMMON_LABELS = ['Frontend', 'Backend', 'UI/UX', 'Bug', 'Architecture', 'Feature', 'Security'];

export function EditTaskDialog() {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state) => state.ui.isEditTaskOpen);
  const editingTaskId = useAppSelector((state) => state.ui.editingTaskId);
  const tasks = useAppSelector((state) => state.task.tasks);
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const mockUsers = useAppSelector((state) => state.auth.mockUsers);
  const activeWorkspaceId = useAppSelector((state) => state.workspace.activeWorkspaceId);
  const allProjects = useAppSelector((state) => state.project.projects);
  const projects = React.useMemo(() => {
    return allProjects.filter((p) => p.workspaceId === activeWorkspaceId && p.status === 'active');
  }, [allProjects, activeWorkspaceId]);

  const task = tasks.find((t) => t.id === editingTaskId);
  const [labels, setLabels] = React.useState<string[]>([]);
  const [customLabelInput, setCustomLabelInput] = React.useState('');

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm<TaskFormValues>({
    defaultValues: {
      title: '',
      description: '',
      status: 'TODO',
      priority: 'MEDIUM',
      projectId: '',
      assigneeId: '',
      dueDate: '',
      labels: [],
    },
  });

  const formValues = watch();

  // Populate form values when modal opens
  React.useEffect(() => {
    if (isOpen && task) {
      const userCanEdit = canEditTask(currentUser?.role, task, currentUser?.id);
      if (!userCanEdit) {
        toast.error('Permission denied: You can only edit tasks you created yourself.');
        dispatch(setEditTaskOpen({ open: false, taskId: null }));
        return;
      }

      const taskLabels = task.labels || [];
      setLabels(taskLabels);
      reset({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'TODO',
        priority: task.priority || 'MEDIUM',
        projectId: task.projectId || '',
        assigneeId: task.assigneeId || '',
        dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
        labels: taskLabels,
      });
    }
  }, [isOpen, editingTaskId, reset, dispatch]);

  const addLabel = (label: string) => {
    const trimmed = label.trim();
    if (trimmed && !labels.includes(trimmed)) {
      const updated = [...labels, trimmed];
      setLabels(updated);
      setValue('labels', updated);
      setCustomLabelInput('');
    }
  };

  const removeLabel = (labelToRemove: string) => {
    const updated = labels.filter((l) => l !== labelToRemove);
    setLabels(updated);
    setValue('labels', updated);
  };

  const onSubmit = (data: TaskFormValues) => {
    if (!currentUser) {
      toast.error('Authentication required');
      return;
    }

    if (!task) {
      toast.error('Task not found');
      return;
    }

    if (!canEditTask(currentUser.role, task, currentUser.id)) {
      toast.error(`Permission denied: You can only edit tasks you created yourself.`);
      return;
    }

    if (!data.title.trim()) {
      toast.error('Task title is required');
      return;
    }

    const previousAssigneeId = task.assigneeId;
    const finalAssigneeId = data.assigneeId || null;
    const finalDueDate = data.dueDate ? new Date(data.dueDate).toISOString() : null;

    dispatch(
      updateTask({
        id: task.id,
        updates: {
          title: data.title.trim(),
          description: data.description || '',
          status: data.status,
          priority: data.priority,
          projectId: data.projectId,
          assigneeId: finalAssigneeId,
          dueDate: finalDueDate,
          labels,
        },
      })
    );

    dispatch(
      logActivity({
        workspaceId: task.workspaceId,
        projectId: data.projectId,
        taskId: task.id,
        userId: currentUser.id,
        action: 'updated task',
        details: `Updated "${data.title}"`,
      })
    );

    // Notify new assignee if changed
    if (finalAssigneeId && finalAssigneeId !== previousAssigneeId && finalAssigneeId !== currentUser.id) {
      dispatch(
        addNotification({
          recipientId: finalAssigneeId,
          senderId: currentUser.id,
          type: 'task_assigned',
          title: 'Task Assigned',
          message: `${currentUser.name} assigned task "${data.title}" to you.`,
          taskId: task.id,
          projectId: data.projectId,
        })
      );
    }

    toast.success(`Task "${data.title}" updated successfully!`);
    dispatch(setEditTaskOpen({ open: false, taskId: null }));
  };

  if (!task) return null;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          dispatch(setEditTaskOpen({ open: false, taskId: null }));
        }
      }}
    >
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-[#222222]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-[#1A1D26] dark:text-white">
            <Pencil className="w-5 h-5 text-[#5D5FEF] dark:text-indigo-400" />
            <span>Edit Task</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-[#7D8592] dark:text-[#888888]">
            Modify ticket parameters, assignees, labels, due dates, and priority level.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-[#1A1D26] dark:text-slate-200">
              Task Title <span className="text-rose-500">*</span>
            </label>
            <Input
              {...register('title', { required: 'Task title is required' })}
              placeholder="e.g. Implement OAuth token refresh strategy"
              className="mt-1 text-xs bg-[#F6F7FB] dark:bg-[#111111] border-[#E5E7EB] dark:border-[#222222]"
            />
            {errors.title && (
              <p className="text-[11px] text-rose-500 mt-1">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-[#1A1D26] dark:text-slate-200">
              Description
            </label>
            <Textarea
              {...register('description')}
              placeholder="Add technical context, requirements, acceptance criteria, or links..."
              rows={3}
              className="mt-1 text-xs bg-[#F6F7FB] dark:bg-[#111111] border-[#E5E7EB] dark:border-[#222222]"
            />
          </div>

          {/* Grid Row: Status & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#1A1D26] dark:text-slate-200">
                Status
              </label>
              <Select
                value={formValues.status}
                onValueChange={(val) => setValue('status', val as TaskStatus)}
              >
                <SelectTrigger className="mt-1 text-xs bg-[#F6F7FB] dark:bg-[#111111] border-[#E5E7EB] dark:border-[#222222]">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BACKLOG">Backlog</SelectItem>
                  <SelectItem value="TODO">To Do</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="DONE">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#1A1D26] dark:text-slate-200">
                Priority
              </label>
              <Select
                value={formValues.priority}
                onValueChange={(val) => setValue('priority', val as TaskPriority)}
              >
                <SelectTrigger className="mt-1 text-xs bg-[#F6F7FB] dark:bg-[#111111] border-[#E5E7EB] dark:border-[#222222]">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">🟢 Low</SelectItem>
                  <SelectItem value="MEDIUM">🟡 Medium</SelectItem>
                  <SelectItem value="HIGH">🟠 High</SelectItem>
                  <SelectItem value="URGENT">🔴 Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Grid Row: Project & Assignee */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#1A1D26] dark:text-slate-200">
                Project
              </label>
              <Select
                value={formValues.projectId}
                onValueChange={(val) => setValue('projectId', val)}
              >
                <SelectTrigger className="mt-1 text-xs bg-[#F6F7FB] dark:bg-[#111111] border-[#E5E7EB] dark:border-[#222222]">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="text-xs">
                      [{p.key}] {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#1A1D26] dark:text-slate-200">
                Assignee
              </label>
              <Select
                value={formValues.assigneeId || 'unassigned'}
                onValueChange={(val) => setValue('assigneeId', val === 'unassigned' ? '' : val)}
              >
                <SelectTrigger className="mt-1 text-xs bg-[#F6F7FB] dark:bg-[#111111] border-[#E5E7EB] dark:border-[#222222]">
                  <SelectValue placeholder="Assign team member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {mockUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id} className="text-xs">
                      {u.name} ({u.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="text-xs font-semibold text-[#1A1D26] dark:text-slate-200">
              Due Date
            </label>
            <Input
              type="date"
              {...register('dueDate')}
              className="mt-1 text-xs bg-[#F6F7FB] dark:bg-[#111111] border-[#E5E7EB] dark:border-[#222222]"
            />
          </div>

          {/* Labels & Tags */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#1A1D26] dark:text-slate-200">
              Labels & Categories
            </label>
            <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 rounded-xl border border-[#E5E7EB] dark:border-[#222222] bg-[#F6F7FB] dark:bg-[#111111]">
              {labels.map((lbl) => (
                <Badge
                  key={lbl}
                  variant="secondary"
                  className="text-xs bg-[#ECEBFF] dark:bg-[#1A1A1A] text-[#5D5FEF] dark:text-indigo-400 border border-[#5D5FEF]/20 flex items-center gap-1"
                >
                  {lbl}
                  <button
                    type="button"
                    onClick={() => removeLabel(lbl)}
                    className="hover:text-rose-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
              {labels.length === 0 && (
                <span className="text-xs text-[#7D8592] italic py-0.5">No labels selected</span>
              )}
            </div>

            {/* Label Suggestions & Add Custom */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {COMMON_LABELS.map((common) => {
                const isSelected = labels.includes(common);
                return (
                  <button
                    key={common}
                    type="button"
                    onClick={() => (isSelected ? removeLabel(common) : addLabel(common))}
                    className={`text-[10px] px-2 py-0.5 rounded-lg border font-medium transition-colors ${
                      isSelected
                        ? 'bg-[#5D5FEF] text-white border-[#5D5FEF]'
                        : 'bg-white dark:bg-[#0A0A0A] border-[#E5E7EB] dark:border-[#222222] text-[#7D8592] dark:text-[#888888] hover:border-[#5D5FEF]'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {common}
                  </button>
                );
              })}
            </div>

            {/* Custom Label Input */}
            <div className="flex gap-1.5 pt-1">
              <Input
                value={customLabelInput}
                onChange={(e) => setCustomLabelInput(e.target.value)}
                placeholder="Add custom label..."
                className="text-xs h-7 bg-[#F6F7FB] dark:bg-[#111111] border-[#E5E7EB] dark:border-[#222222]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addLabel(customLabelInput);
                  }
                }}
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 text-xs border-[#E5E7EB] dark:border-[#222222]"
                onClick={() => addLabel(customLabelInput)}
              >
                <Plus className="w-3 h-3 mr-1" /> Add
              </Button>
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-[#E5E7EB] dark:border-[#222222] flex items-center justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => dispatch(setEditTaskOpen({ open: false, taskId: null }))}
              className="text-xs border-[#E5E7EB] dark:border-[#222222]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-[#5D5FEF] hover:bg-[#4E50E6] text-white text-xs font-semibold px-4"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
