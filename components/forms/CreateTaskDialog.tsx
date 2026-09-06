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
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAppDispatch, useAppSelector } from '@/store';
import { createTask } from '@/store/slices/taskSlice';
import { setCreateTaskOpen } from '@/store/slices/uiSlice';
import { logActivity } from '@/store/slices/activitySlice';
import { addNotification } from '@/store/slices/notificationSlice';
import { TaskFormValues, TaskPriority, TaskStatus } from '@/types/task';
import { canCreateTask } from '@/lib/permissions';
import { CheckSquare, Plus, X } from 'lucide-react';

const COMMON_LABELS = ['Frontend', 'Backend', 'UI/UX', 'Bug', 'Architecture', 'Feature', 'Security'];

export function CreateTaskDialog() {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state) => state.ui.isCreateTaskOpen);
  const defaultStatus = useAppSelector((state) => state.ui.createTaskDefaultStatus);
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const mockUsers = useAppSelector((state) => state.auth.mockUsers);
  const activeWorkspaceId = useAppSelector((state) => state.workspace.activeWorkspaceId);
  const activeProjectId = useAppSelector((state) => state.project.activeProjectId);
  const allProjects = useAppSelector((state) => state.project.projects);
  const projects = React.useMemo(() => {
    return allProjects.filter((p) => p.workspaceId === activeWorkspaceId && p.status === 'active');
  }, [allProjects, activeWorkspaceId]);

  const [labels, setLabels] = React.useState<string[]>(['Frontend']);
  const [customLabelInput, setCustomLabelInput] = React.useState('');

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<TaskFormValues>({
    defaultValues: {
      title: '',
      description: '',
      status: defaultStatus || 'TODO',
      priority: 'MEDIUM',
      projectId: activeProjectId || projects[0]?.id || '',
      assigneeId: currentUser?.id || '',
      dueDate: '',
      labels: ['Frontend'],
    },
  });

  // Keep defaults updated when modal opens or activeProjectId/defaultStatus changes
  React.useEffect(() => {
    if (isOpen) {
      setValue('status', defaultStatus || 'TODO');
      if (activeProjectId) {
        setValue('projectId', activeProjectId);
      } else if (projects.length > 0) {
        setValue('projectId', projects[0].id);
      }
      if (currentUser) {
        setValue('assigneeId', currentUser.id);
      }
    }
  }, [isOpen, defaultStatus, activeProjectId, projects, currentUser, setValue]);

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

    if (!canCreateTask(currentUser.role)) {
      toast.error(`Permission denied: ${currentUser.role}s cannot create tasks.`);
      return;
    }

    if (!data.projectId) {
      toast.error('Please select a project for this task');
      return;
    }

    const assignedUser = mockUsers.find((u) => u.id === data.assigneeId);

    dispatch(
      createTask({
        ...data,
        labels,
        workspaceId: activeWorkspaceId,
        reporterId: currentUser.id,
      })
    );

    dispatch(
      logActivity({
        workspaceId: activeWorkspaceId,
        projectId: data.projectId,
        userId: currentUser.id,
        action: 'created task',
        details: `Created "${data.title}" in ${data.status}`,
      })
    );

    // Notify assignee if not creator
    if (data.assigneeId && data.assigneeId !== currentUser.id) {
      dispatch(
        addNotification({
          recipientId: data.assigneeId,
          senderId: currentUser.id,
          type: 'task_assigned',
          title: 'Task Assigned',
          message: `${currentUser.name} assigned task "${data.title}" to you.`,
          projectId: data.projectId,
        })
      );
    }

    toast.success(`Task "${data.title}" created successfully!`);
    reset();
    setLabels(['Frontend']);
    dispatch(setCreateTaskOpen({ open: false }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => dispatch(setCreateTaskOpen({ open }))}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CheckSquare className="w-5 h-5 text-indigo-400" />
            <span>Create New Task</span>
          </DialogTitle>
          <DialogDescription>
            Add a ticket with assignees, labels, due dates, and priority level.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div>
            <label className="text-xs font-medium text-slate-300">Task Title *</label>
            <Input
              {...register('title', { required: 'Task title is required' })}
              placeholder="e.g. Implement resilient local storage undo/redo cache"
              className="mt-1"
              error={errors.title?.message}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300">Description</label>
            <Textarea
              {...register('description')}
              placeholder="Provide technical context, acceptance criteria, or design links..."
              className="mt-1 min-h-[80px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-300">Target Project *</label>
              <Select
                defaultValue={activeProjectId || projects[0]?.id || ''}
                onValueChange={(val) => setValue('projectId', val)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((proj) => (
                    <SelectItem key={proj.id} value={proj.id}>
                      [{proj.key}] {proj.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300">Initial Status</label>
              <Select
                defaultValue={defaultStatus || 'TODO'}
                onValueChange={(val) => setValue('status', val as TaskStatus)}
              >
                <SelectTrigger className="mt-1">
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
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-300">Priority</label>
              <Select
                defaultValue="MEDIUM"
                onValueChange={(val) => setValue('priority', val as TaskPriority)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">🟢 Low</SelectItem>
                  <SelectItem value="MEDIUM">🟡 Medium</SelectItem>
                  <SelectItem value="HIGH">🟠 High</SelectItem>
                  <SelectItem value="URGENT">🔴 Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300">Assignee</label>
              <Select
                defaultValue={currentUser?.id || ''}
                onValueChange={(val) => setValue('assigneeId', val)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Assignee" />
                </SelectTrigger>
                <SelectContent>
                  {mockUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300">Due Date</label>
              <Input
                type="date"
                {...register('dueDate')}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300">Labels / Tags</label>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {labels.map((lbl) => (
                <Badge key={lbl} variant="secondary" className="flex items-center space-x-1 pl-2 pr-1">
                  <span>{lbl}</span>
                  <button
                    type="button"
                    onClick={() => removeLabel(lbl)}
                    className="rounded-full hover:bg-slate-700 p-0.5 ml-1"
                  >
                    <X className="w-3 h-3 text-slate-400" />
                  </button>
                </Badge>
              ))}
            </div>

            <div className="flex items-center space-x-2 mt-2">
              <Input
                value={customLabelInput}
                onChange={(e) => setCustomLabelInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addLabel(customLabelInput);
                  }
                }}
                placeholder="Type label and press Enter or click +"
                className="h-8 text-xs"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => addLabel(customLabelInput)}
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-1 mt-1.5">
              {COMMON_LABELS.map((common) => (
                <button
                  key={common}
                  type="button"
                  onClick={() => addLabel(common)}
                  className="text-[10px] text-slate-400 bg-slate-800/80 hover:bg-slate-700 hover:text-white px-1.5 py-0.5 rounded transition-colors"
                >
                  +{common}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => dispatch(setCreateTaskOpen({ open: false }))}
            >
              Cancel
            </Button>
            <Button type="submit">
              Create Task
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
