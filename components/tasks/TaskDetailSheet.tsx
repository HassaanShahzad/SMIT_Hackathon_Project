'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
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
import { UserAvatar } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  updateTask,
  deleteTask,
  duplicateTask,
  restoreTask,
  createTask,
} from '@/store/slices/taskSlice';
import {
  createSubtask,
  toggleSubtask,
  deleteSubtask,
  updateSubtask,
  convertTaskToSubtask,
} from '@/store/slices/subtaskSlice';
import { addComment, deleteComment } from '@/store/slices/commentSlice';
import { closeTaskDetail, openTaskDetail } from '@/store/slices/uiSlice';
import { logActivity } from '@/store/slices/activitySlice';
import { addNotification } from '@/store/slices/notificationSlice';
import { canEditTask, canDeleteTask } from '@/lib/permissions';
import { formatDate, formatRelativeTime, isOverdue } from '@/lib/utils';
import { TaskPriority, TaskStatus, Subtask } from '@/types/task';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  MessageSquare,
  Paperclip,
  Plus,
  Send,
  Trash2,
  User,
  ArrowUpRight,
  Sparkles,
  AlertCircle,
  Activity,
  History,
  CornerDownRight,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';

export function TaskDetailSheet() {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state) => state.ui.taskDetailOpen);
  const activeTaskId = useAppSelector((state) => state.ui.activeTaskId);
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const mockUsers = useAppSelector((state) => state.auth.mockUsers);
  const tasks = useAppSelector((state) => state.task.tasks);
  const projects = useAppSelector((state) => state.project.projects);
  const allSubtasks = useAppSelector((state) => state.subtask.subtasks);
  const subtasks = allSubtasks.filter((s) => s.taskId === activeTaskId);
  const comments = useAppSelector((state) =>
    state.comment.comments.filter((c) => c.taskId === activeTaskId)
  );
  const activities = useAppSelector((state) =>
    state.activity.activities.filter((a) => a.taskId === activeTaskId)
  );

  const task = tasks.find((t) => t.id === activeTaskId);
  const project = projects.find((p) => p.id === task?.projectId);
  const assignee = mockUsers.find((u) => u.id === task?.assigneeId);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const [descriptionValue, setDescriptionValue] = useState('');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [editingSubtaskText, setEditingSubtaskText] = useState('');
  const [addingChildForId, setAddingChildForId] = useState<string | null>(null);
  const [childSubtaskTitle, setChildSubtaskTitle] = useState('');
  const [isConvertDialogOpen, setIsConvertDialogOpen] = useState(false);
  const [targetParentTaskId, setTargetParentTaskId] = useState<string>('');

  // Comment Form
  const { register: registerComment, handleSubmit: handleSubmitComment, reset: resetComment } = useForm<{
    content: string;
  }>({
    defaultValues: { content: '' },
  });

  React.useEffect(() => {
    if (task) {
      setTitleValue(task.title);
      setDescriptionValue(task.description);
    }
  }, [task]);

  if (!task) return null;

  const userCanEdit = canEditTask(currentUser?.role, task, currentUser?.id);
  const userCanDelete = canDeleteTask(currentUser?.role, task, currentUser?.id);

  // Candidate parent tasks for conversion: cannot be self
  const candidateParentTasks = tasks.filter((t) => t.id !== task.id);

  // Subtask progress
  const totalSubtasks = subtasks.length;
  const completedSubtasks = subtasks.filter((s) => s.completed).length;
  const progressPercent = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  const handleTitleSave = () => {
    if (!userCanEdit) {
      toast.error('Permission denied: You can only edit tasks you created yourself.');
      setIsEditingTitle(false);
      return;
    }
    if (titleValue.trim() && titleValue !== task.title) {
      dispatch(updateTask({ id: task.id, updates: { title: titleValue.trim() } }));
      toast.success('Task title updated');
    }
    setIsEditingTitle(false);
  };

  const handleDescriptionSave = () => {
    if (!userCanEdit) {
      toast.error('Permission denied: You can only edit tasks you created yourself.');
      return;
    }
    dispatch(updateTask({ id: task.id, updates: { description: descriptionValue } }));
    toast.success('Description saved');
  };

  const handleStatusChange = (newStatus: TaskStatus) => {
    if (!userCanEdit) {
      toast.error('Permission denied: You can only change status of tasks you created yourself.');
      return;
    }
    dispatch(updateTask({ id: task.id, updates: { status: newStatus } }));
    dispatch(
      logActivity({
        workspaceId: task.workspaceId,
        projectId: task.projectId,
        taskId: task.id,
        userId: currentUser?.id || 'unknown',
        action: 'changed status',
        details: `Updated status to ${newStatus}`,
      })
    );
    toast.success(`Task status changed to ${newStatus}`);
  };

  const handlePriorityChange = (newPriority: TaskPriority) => {
    if (!userCanEdit) {
      toast.error('Permission denied: You can only update priority of tasks you created yourself.');
      return;
    }
    dispatch(updateTask({ id: task.id, updates: { priority: newPriority } }));
    toast.success(`Priority set to ${newPriority}`);
  };

  const handleAssigneeChange = (newAssigneeId: string) => {
    if (!userCanEdit) {
      toast.error('Permission denied: You can only change assignees of tasks you created yourself.');
      return;
    }
    const finalId = newAssigneeId === 'unassigned' ? null : newAssigneeId;
    dispatch(updateTask({ id: task.id, updates: { assigneeId: finalId } }));
    const u = mockUsers.find((user) => user.id === finalId);
    if (finalId && finalId !== currentUser?.id) {
      dispatch(
        addNotification({
          recipientId: finalId,
          senderId: currentUser?.id || 'sys',
          type: 'task_assigned',
          title: 'Task Assigned',
          message: `${currentUser?.name} assigned you to "${task.title}"`,
          taskId: task.id,
          projectId: task.projectId,
        })
      );
    }
    toast.success(finalId ? `Assigned to ${u?.name}` : 'Task unassigned');
  };

  const handleDuplicate = () => {
    if (!userCanEdit) {
      toast.error('Permission denied: You can only duplicate tasks you created yourself.');
      return;
    }
    dispatch(duplicateTask(task.id));
    toast.success('Task duplicated');
    dispatch(closeTaskDetail());
  };

  const handleDelete = () => {
    if (!userCanDelete) {
      toast.error('Permission denied: You can only delete tasks you created yourself.');
      return;
    }
    const taskToDelete = { ...task };
    dispatch(deleteTask(task.id));
    dispatch(closeTaskDetail());

    // Undo Sonner toast notification
    toast('Task deleted', {
      description: `"${taskToDelete.title}" was moved to trash.`,
      action: {
        label: 'Undo',
        onClick: () => {
          dispatch(restoreTask(taskToDelete));
          dispatch(openTaskDetail(taskToDelete.id));
          toast.success('Task restored successfully!');
        },
      },
    });
  };

  // Subtask handlers
  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    if (!userCanEdit) {
      toast.error('Permission denied: Viewers cannot add subtasks.');
      return;
    }
    dispatch(createSubtask({ taskId: task.id, title: newSubtaskTitle.trim() }));
    setNewSubtaskTitle('');
  };

  const handleAddChildSubtask = (parentId: string) => {
    if (!childSubtaskTitle.trim()) return;
    if (!userCanEdit) {
      toast.error('Permission denied: Viewers cannot add subtasks.');
      return;
    }
    dispatch(
      createSubtask({
        taskId: task.id,
        parentId,
        title: childSubtaskTitle.trim(),
      })
    );
    setChildSubtaskTitle('');
    setAddingChildForId(null);
    toast.success('Nested subtask added');
  };

  const handleSaveSubtaskEdit = (subtaskId: string) => {
    if (editingSubtaskText.trim()) {
      dispatch(updateSubtask({ id: subtaskId, title: editingSubtaskText.trim() }));
    }
    setEditingSubtaskId(null);
  };

  // Convert subtask to standalone task
  const handleConvertSubtaskToTask = (sub: Subtask) => {
    if (!userCanEdit) return;
    dispatch(deleteSubtask(sub.id));
    dispatch(
      createTask({
        title: sub.title,
        description: `Converted from subtask of ${project?.key || 'TASK'}-${task.taskNumber} ("${task.title}")`,
        status: sub.completed ? ('DONE' as TaskStatus) : ('TODO' as TaskStatus),
        priority: task.priority,
        projectId: task.projectId,
        workspaceId: task.workspaceId,
        assigneeId: sub.assigneeId || task.assigneeId || undefined,
        dueDate: sub.dueDate || task.dueDate || undefined,
        labels: [...task.labels],
        reporterId: currentUser?.id || 'sys',
      })
    );
    toast.success(`Subtask converted to standalone task!`);
  };

  // Convert current task to subtask of another task
  const handleConfirmConvertTaskToSubtask = () => {
    if (!targetParentTaskId) {
      toast.error('Please select a target parent task.');
      return;
    }
    if (targetParentTaskId === task.id) {
      toast.error('Circular relationship prevented: A task cannot be a subtask of itself.');
      return;
    }

    const parentTask = tasks.find((t) => t.id === targetParentTaskId);
    if (!parentTask) {
      toast.error('Parent task not found.');
      return;
    }

    dispatch(
      convertTaskToSubtask({
        parentTaskId: targetParentTaskId,
        subtaskTitle: task.title,
      })
    );

    // Delete current task
    dispatch(deleteTask(task.id));
    setIsConvertDialogOpen(false);
    toast.success(`Converted to subtask of "${parentTask.title}"`);
    dispatch(openTaskDetail(targetParentTaskId));
  };

  // Comment submit
  const onCommentSubmit = (data: { content: string }) => {
    if (!data.content.trim() || !currentUser) return;
    if (currentUser.role === 'Viewer') {
      toast.error('Permission denied: Viewers cannot post comments.');
      return;
    }

    // Detect @mentions
    const mentionRegex = /@([a-zA-Z]+(?:\s+[a-zA-Z]+)?)/g;
    const matches = data.content.match(mentionRegex) || [];
    const mentionedUserIds: string[] = [];

    matches.forEach((m) => {
      const name = m.substring(1).toLowerCase();
      const matched = mockUsers.find((u) => u.name.toLowerCase().includes(name));
      if (matched && !mentionedUserIds.includes(matched.id)) {
        mentionedUserIds.push(matched.id);
        // Send notification to mentioned user
        if (matched.id !== currentUser.id) {
          dispatch(
            addNotification({
              recipientId: matched.id,
              senderId: currentUser.id,
              type: 'mention',
              title: 'Mentioned in comment',
              message: `${currentUser.name} mentioned you in "${task.title}"`,
              taskId: task.id,
              projectId: task.projectId,
            })
          );
        }
      }
    });

    dispatch(
      addComment({
        taskId: task.id,
        authorId: currentUser.id,
        content: data.content,
        mentions: mentionedUserIds,
      })
    );

    dispatch(
      logActivity({
        workspaceId: task.workspaceId,
        projectId: task.projectId,
        taskId: task.id,
        userId: currentUser.id,
        action: 'added comment',
        details: data.content.substring(0, 40) + '...',
      })
    );

    resetComment();
    toast.success('Comment added');
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && dispatch(closeTaskDetail())}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto p-0">
        {/* Header Bar */}
        <div className="p-5 border-b border-[#E5E7EB] dark:border-[#222222] bg-white/95 dark:bg-[#0A0A0A]/95 sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2 text-xs font-mono text-[#7D8592] dark:text-[#888888]">
              <span className="font-semibold text-[#5D5FEF] dark:text-indigo-400">
                {project?.key || 'PRJ'}-{task.taskNumber}
              </span>
              <span>•</span>
              <span className="text-[#7D8592] dark:text-[#888888]">{project?.name || 'General'}</span>
            </div>

            <div className="flex items-center space-x-1.5 mr-6">
              {userCanEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-[#5D5FEF] dark:text-indigo-400 hover:bg-[#ECEBFF] dark:hover:bg-[#1A1A1A]"
                  onClick={() => setIsConvertDialogOpen(true)}
                  title="Convert this task into a subtask of another task"
                >
                  <CornerDownRight className="w-3.5 h-3.5 mr-1" /> Make Subtask
                </Button>
              )}
              {userCanEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-[#1A1D26] dark:text-[#EDEDED]"
                  onClick={handleDuplicate}
                >
                  <Copy className="w-3.5 h-3.5 mr-1" /> Duplicate
                </Button>
              )}
              {userCanDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                  onClick={handleDelete}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                </Button>
              )}
            </div>
          </div>

          {/* Title input */}
          {isEditingTitle ? (
            <Input
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
              autoFocus
              className="text-lg font-semibold bg-white dark:bg-[#0A0A0A] border-[#5D5FEF]"
            />
          ) : (
            <h2
              onClick={() => userCanEdit && setIsEditingTitle(true)}
              className={`text-lg font-semibold text-[#1A1D26] dark:text-[#EDEDED] leading-tight ${
                userCanEdit ? 'cursor-pointer hover:text-[#5D5FEF] dark:hover:text-indigo-400' : ''
              }`}
              title={userCanEdit ? 'Click to edit title' : ''}
            >
              {task.title}
            </h2>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl border border-[#E5E7EB] dark:border-[#222222] bg-[#F6F7FB] dark:bg-[#111111]/40">
            {/* Status */}
            <div>
              <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                Status
              </label>
              <Select
                value={task.status}
                onValueChange={(val) => handleStatusChange(val as TaskStatus)}
                disabled={!userCanEdit}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BACKLOG">Backlog</SelectItem>
                  <SelectItem value="TODO">To Do</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="DONE">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div>
              <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                Priority
              </label>
              <Select
                value={task.priority}
                onValueChange={(val) => handlePriorityChange(val as TaskPriority)}
                disabled={!userCanEdit}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">🟢 Low</SelectItem>
                  <SelectItem value="MEDIUM">🟡 Medium</SelectItem>
                  <SelectItem value="HIGH">🟠 High</SelectItem>
                  <SelectItem value="URGENT">🔴 Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Assignee */}
            <div>
              <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                Assignee
              </label>
              <Select
                value={task.assigneeId || 'unassigned'}
                onValueChange={handleAssigneeChange}
                disabled={!userCanEdit}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {mockUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Due Date */}
            <div>
              <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                Due Date
              </label>
              <div className="flex items-center space-x-1">
                <Input
                  type="date"
                  value={task.dueDate ? task.dueDate.slice(0, 10) : ''}
                  disabled={!userCanEdit}
                  onChange={(e) => {
                    if (!userCanEdit) return;
                    dispatch(
                      updateTask({
                        id: task.id,
                        updates: { dueDate: e.target.value ? new Date(e.target.value).toISOString() : null },
                      })
                    );
                    toast.success('Due date updated');
                  }}
                  className="h-8 text-xs p-1"
                />
              </div>
            </div>
          </div>

          {/* Labels & Tags */}
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Labels & Tags</div>
            <div className="flex flex-wrap gap-1.5">
              {task.labels.map((lbl) => (
                <Badge key={lbl} variant="secondary" className="text-xs">
                  {lbl}
                </Badge>
              ))}
              {task.labels.length === 0 && (
                <span className="text-xs text-slate-400 italic">No labels attached</span>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Description</span>
              {userCanEdit && (
                <button
                  type="button"
                  onClick={handleDescriptionSave}
                  className="text-xs text-purple-600 dark:text-purple-400 font-medium hover:underline"
                >
                  Save description
                </button>
              )}
            </div>
            <Textarea
              value={descriptionValue}
              onChange={(e) => setDescriptionValue(e.target.value)}
              placeholder="Add technical context, specifications, or notes..."
              className="min-h-[100px] text-sm"
              disabled={!userCanEdit}
            />
          </div>

          {/* Hierarchical Subtasks Section (Section 17) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-200">Nested Subtasks</span>
                <span className="text-xs text-slate-500">
                  ({completedSubtasks}/{totalSubtasks})
                </span>
              </div>
              <span className="text-xs font-mono text-purple-600 dark:text-purple-400 font-semibold">{progressPercent}%</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-600 dark:bg-purple-500 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Hierarchical Subtask Tree */}
            <div className="space-y-2">
              {(() => {
                const rootSubtasks = subtasks.filter(
                  (s) => !s.parentId || !subtasks.some((parent) => parent.id === s.parentId)
                );

                const renderItem = (sub: Subtask, level = 0) => {
                  const childSubtasks = subtasks.filter((s) => s.parentId === sub.id);
                  const isAddingChild = addingChildForId === sub.id;

                  return (
                    <div key={sub.id} className="space-y-1.5">
                      <div
                        className={`group flex items-center justify-between p-2 rounded-lg border border-[#E5E7EB] dark:border-[#222222] bg-[#F6F7FB]/70 dark:bg-[#111111]/40 hover:bg-[#F6F7FB] dark:hover:bg-[#1A1A1A] transition-all ${
                          level > 0 ? 'ml-5 pl-2.5 border-l-2 border-l-[#5D5FEF]/50' : ''
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 flex-1 min-w-0 mr-2">
                          {level > 0 && <CornerDownRight className="w-3 h-3 text-[#5D5FEF] shrink-0 opacity-70" />}
                          <Checkbox
                            checked={sub.completed}
                            onCheckedChange={() => dispatch(toggleSubtask(sub.id))}
                            disabled={!userCanEdit}
                          />
                          {editingSubtaskId === sub.id ? (
                            <input
                              value={editingSubtaskText}
                              onChange={(e) => setEditingSubtaskText(e.target.value)}
                              onBlur={() => handleSaveSubtaskEdit(sub.id)}
                              onKeyDown={(e) => e.key === 'Enter' && handleSaveSubtaskEdit(sub.id)}
                              autoFocus
                              className="text-xs bg-white dark:bg-[#0A0A0A] px-2 py-0.5 rounded border border-[#5D5FEF] text-[#1A1D26] dark:text-[#EDEDED] w-full"
                            />
                          ) : (
                            <span
                              onClick={() => {
                                if (userCanEdit) {
                                  setEditingSubtaskId(sub.id);
                                  setEditingSubtaskText(sub.title);
                                }
                              }}
                              className={`text-xs truncate ${
                                sub.completed ? 'line-through text-[#7D8592] dark:text-[#888888]' : 'text-[#1A1D26] dark:text-[#EDEDED]'
                              } cursor-pointer hover:text-[#5D5FEF] dark:hover:text-indigo-400`}
                              title={userCanEdit ? 'Click to edit title' : ''}
                            >
                              {sub.title}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {userCanEdit && level < 3 && (
                            <button
                              type="button"
                              onClick={() => {
                                setAddingChildForId(addingChildForId === sub.id ? null : sub.id);
                                setChildSubtaskTitle('');
                              }}
                              className="p-1 rounded text-[#7D8592] dark:text-[#888888] hover:text-[#5D5FEF] dark:hover:text-indigo-400 hover:bg-[#ECEBFF] dark:hover:bg-[#1A1A1A]"
                              title="Add child subtask"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {userCanEdit && (
                            <button
                              type="button"
                              onClick={() => handleConvertSubtaskToTask(sub)}
                              className="p-1 rounded text-[#7D8592] dark:text-[#888888] hover:text-[#5D5FEF] dark:hover:text-indigo-400 hover:bg-[#ECEBFF] dark:hover:bg-[#1A1A1A]"
                              title="Convert to standalone task"
                            >
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {userCanEdit && (
                            <button
                              type="button"
                              onClick={() => dispatch(deleteSubtask(sub.id))}
                              className="p-1 rounded text-[#7D8592] dark:text-[#888888] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-[#1A1A1A]"
                              title="Delete subtask"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Inline child adder */}
                      {isAddingChild && (
                        <div className={`flex items-center space-x-2 pl-6 py-1 ${level > 0 ? 'ml-5' : ''}`}>
                          <Input
                            value={childSubtaskTitle}
                            onChange={(e) => setChildSubtaskTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddChildSubtask(sub.id);
                              }
                            }}
                            placeholder={`Add sub-item under "${sub.title}"...`}
                            className="h-7 text-xs bg-white dark:bg-[#0A0A0A] border-[#E5E7EB] dark:border-[#222222]"
                            autoFocus
                          />
                          <Button
                            size="sm"
                            type="button"
                            className="h-7 text-xs bg-[#5D5FEF] hover:bg-[#5D5FEF]/90 text-white"
                            onClick={() => handleAddChildSubtask(sub.id)}
                          >
                            Add
                          </Button>
                          <Button
                            size="sm"
                            type="button"
                            variant="ghost"
                            className="h-7 text-xs"
                            onClick={() => setAddingChildForId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      )}

                      {/* Render nested child subtasks */}
                      {childSubtasks.map((child) => renderItem(child, level + 1))}
                    </div>
                  );
                };

                return (
                  <div className="space-y-1.5">
                    {rootSubtasks.map((sub) => renderItem(sub, 0))}
                    {rootSubtasks.length === 0 && (
                      <div className="py-4 text-center text-xs text-[#7D8592] dark:text-[#888888] italic">
                        No subtasks yet. Add one below!
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Add Root Subtask Form */}
            {userCanEdit && (
              <form onSubmit={handleAddSubtask} className="flex items-center space-x-2 pt-1">
                <Input
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  placeholder="Add a new checklist item..."
                  className="h-8 text-xs bg-white dark:bg-[#0A0A0A] border-[#E5E7EB] dark:border-[#222222]"
                />
                <Button type="submit" size="sm" variant="outline" className="h-8 text-xs border-[#E5E7EB] dark:border-[#222222]">
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Item
                </Button>
              </form>
            )}
          </div>

          <Separator />

          {/* Activity & Comments Tabs */}
          <Tabs defaultValue="comments" className="w-full">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="comments" className="flex items-center space-x-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Comments ({comments.length})</span>
              </TabsTrigger>
              <TabsTrigger value="activity" className="flex items-center space-x-1.5">
                <History className="w-3.5 h-3.5" />
                <span>Audit Trail</span>
              </TabsTrigger>
            </TabsList>

            {/* Comments Tab */}
            <TabsContent value="comments" className="space-y-4 py-2">
              <div className="space-y-3">
                {comments.map((comment) => {
                  const author = mockUsers.find((u) => u.id === comment.authorId);
                  const isAuthor = currentUser?.id === comment.authorId;

                  return (
                    <div
                      key={comment.id}
                      className="p-3 rounded-xl border border-[#E5E7EB] dark:border-[#222222] bg-[#F6F7FB] dark:bg-[#111111]/50 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <UserAvatar name={author?.name} avatarUrl={author?.avatarUrl} size="sm" />
                          <span className="text-xs font-semibold text-[#1A1D26] dark:text-[#EDEDED]">
                            {author?.name || 'Teammate'}
                          </span>
                          <span className="text-[10px] text-[#7D8592] dark:text-[#888888]">
                            {formatRelativeTime(comment.createdAt)}
                          </span>
                        </div>
                        {isAuthor && (
                          <button
                            type="button"
                            onClick={() => dispatch(deleteComment(comment.id))}
                            className="text-[#7D8592] hover:text-rose-500 p-1"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-[#1A1D26] dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                        {comment.content}
                      </p>
                    </div>
                  );
                })}

                {comments.length === 0 && (
                  <div className="py-6 text-center text-xs text-[#7D8592] dark:text-[#888888]">
                    No comments yet. Mention teammates with <code>@Name</code> to notify them.
                  </div>
                )}
              </div>

              {/* Comment Input Form */}
              <form onSubmit={handleSubmitComment(onCommentSubmit)} className="space-y-2 pt-2">
                <Textarea
                  {...registerComment('content', { required: true })}
                  placeholder="Leave a comment or mention @Alex, @Sarah, @Marcus..."
                  className="min-h-[70px] text-xs"
                />
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-[#7D8592] dark:text-[#888888]">
                    Tip: Use <strong>@Name</strong> to trigger member notification
                  </span>
                  <Button type="submit" size="sm" className="bg-[#5D5FEF] hover:bg-[#5D5FEF]/90 text-white">
                    <Send className="w-3.5 h-3.5 mr-1.5" /> Post Comment
                  </Button>
                </div>
              </form>
            </TabsContent>

            {/* Audit Log Tab */}
            <TabsContent value="activity" className="space-y-2 py-2">
              {activities.length > 0 ? (
                <div className="space-y-2">
                  {activities.map((act) => {
                    const actor = mockUsers.find((u) => u.id === act.userId);
                    return (
                      <div
                        key={act.id}
                        className="flex items-start space-x-2.5 p-2 rounded-xl border border-[#E5E7EB] dark:border-[#222222] bg-[#F6F7FB] dark:bg-[#111111]/30 text-xs"
                      >
                        <UserAvatar name={actor?.name} avatarUrl={actor?.avatarUrl} size="sm" />
                        <div className="flex-1">
                          <div className="text-[#1A1D26] dark:text-[#EDEDED]">
                            <strong>{actor?.name || 'Someone'}</strong> {act.action}
                          </div>
                          {act.details && <div className="text-[#7D8592] dark:text-[#888888] text-[11px] mt-0.5">{act.details}</div>}
                          <div className="text-[10px] text-[#7D8592] dark:text-[#888888] mt-1">
                            {formatRelativeTime(act.timestamp)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-[#7D8592] dark:text-[#888888]">
                  No activity history logged for this ticket yet.
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Convert Task to Subtask Dialog (Section 17) */}
        <Dialog open={isConvertDialogOpen} onOpenChange={setIsConvertDialogOpen}>
          <DialogContent className="sm:max-w-md bg-white dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-[#222222]">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2 text-slate-900 dark:text-slate-100">
                <CornerDownRight className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <span>Convert Task to Subtask</span>
              </DialogTitle>
              <DialogDescription className="text-slate-600 dark:text-slate-400 text-xs">
                Turn &ldquo;{task.title}&rdquo; into a subtask of another task. Circular relationships are strictly prevented.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-3">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                Select Target Parent Task
              </label>
              <Select value={targetParentTaskId} onValueChange={setTargetParentTaskId}>
                <SelectTrigger className="w-full text-xs bg-white dark:bg-slate-950">
                  <SelectValue placeholder="Select target parent task..." />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {candidateParentTasks.map((t) => (
                    <SelectItem key={t.id} value={t.id} className="text-xs">
                      <span className="font-mono text-purple-600 dark:text-purple-400 mr-1.5 font-semibold">
                        #{t.taskNumber}
                      </span>
                      {t.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => setIsConvertDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="text-xs bg-purple-600 hover:bg-purple-700 text-white font-medium"
                onClick={handleConfirmConvertTaskToSubtask}
                disabled={!targetParentTaskId}
              >
                Convert to Subtask
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SheetContent>
    </Sheet>
  );
}
