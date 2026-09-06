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
import { useAppDispatch, useAppSelector } from '@/store';
import { createWorkspace } from '@/store/slices/workspaceSlice';
import { setCreateWorkspaceOpen } from '@/store/slices/uiSlice';
import { logActivity } from '@/store/slices/activitySlice';
import { canCreateWorkspace } from '@/lib/permissions';
import { WorkspaceColor, WorkspaceFormValues } from '@/types/workspace';
import { Layers, Palette, Briefcase, Zap, Rocket, Check } from 'lucide-react';

const COLORS: { label: string; value: WorkspaceColor; bg: string }[] = [
  { label: 'Indigo', value: 'indigo', bg: 'bg-indigo-500' },
  { label: 'Emerald', value: 'emerald', bg: 'bg-emerald-500' },
  { label: 'Purple', value: 'purple', bg: 'bg-purple-500' },
  { label: 'Rose', value: 'rose', bg: 'bg-rose-500' },
  { label: 'Sky', value: 'sky', bg: 'bg-sky-500' },
  { label: 'Amber', value: 'amber', bg: 'bg-amber-500' },
];

const ICONS = [
  { label: 'Layers', value: 'Layers', icon: Layers },
  { label: 'Palette', value: 'Palette', icon: Palette },
  { label: 'Briefcase', value: 'Briefcase', icon: Briefcase },
  { label: 'Zap', value: 'Zap', icon: Zap },
  { label: 'Rocket', value: 'Rocket', icon: Rocket },
];

export function CreateWorkspaceDialog() {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state) => state.ui.isCreateWorkspaceOpen);
  const currentUser = useAppSelector((state) => state.auth.currentUser);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<WorkspaceFormValues>({
    defaultValues: {
      name: '',
      description: '',
      icon: 'Layers',
      color: 'indigo',
      defaultView: 'kanban',
    },
  });

  const selectedColor = watch('color');
  const selectedIcon = watch('icon');

  const onSubmit = (data: WorkspaceFormValues) => {
    if (!currentUser) {
      toast.error('You must be logged in to create a workspace');
      return;
    }

    if (!canCreateWorkspace(currentUser.role)) {
      toast.error(`Permission denied: ${currentUser.role}s cannot create workspaces.`);
      return;
    }

    dispatch(
      createWorkspace({
        ...data,
        ownerId: currentUser.id,
      })
    );

    dispatch(
      logActivity({
        workspaceId: 'new',
        userId: currentUser.id,
        action: 'created workspace',
        details: `Created workspace "${data.name}"`,
      })
    );

    toast.success(`Workspace "${data.name}" created successfully!`);
    reset();
    dispatch(setCreateWorkspaceOpen(false));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => dispatch(setCreateWorkspaceOpen(open))}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Workspace</DialogTitle>
          <DialogDescription>
            Workspaces organize teams, projects, workflows, and task tracking.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div>
            <label className="text-xs font-medium text-slate-300">Workspace Name *</label>
            <Input
              {...register('name', { required: 'Workspace name is required' })}
              placeholder="e.g. Acme Corp, Design Sprint"
              className="mt-1"
              error={errors.name?.message}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300">Description</label>
            <Textarea
              {...register('description')}
              placeholder="Brief summary of this workspace's purpose..."
              className="mt-1 min-h-[60px]"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300">Brand Color Accent</label>
            <div className="flex items-center space-x-2 mt-1.5">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setValue('color', c.value)}
                  className={`w-7 h-7 rounded-full ${c.bg} flex items-center justify-center transition-all ${
                    selectedColor === c.value
                      ? 'ring-2 ring-[#5D5FEF] scale-110'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                  title={c.label}
                >
                  {selectedColor === c.value && <Check className="w-4 h-4 text-white" />}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#1A1D26] dark:text-[#EDEDED]">Workspace Icon</label>
            <div className="grid grid-cols-5 gap-2 mt-1.5">
              {ICONS.map((i) => {
                const IconComponent = i.icon;
                const isSelected = selectedIcon === i.value;
                return (
                  <button
                    key={i.value}
                    type="button"
                    onClick={() => setValue('icon', i.value)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
                      isSelected
                        ? 'border-[#5D5FEF] bg-[#ECEBFF] text-[#5D5FEF] dark:bg-[#1A1A1A] dark:text-white font-semibold'
                        : 'border-[#E5E7EB] dark:border-[#222222] bg-[#F6F7FB] dark:bg-[#111111] text-[#7D8592] dark:text-[#888888] hover:text-[#1A1D26] dark:hover:text-white'
                    }`}
                  >
                    <IconComponent className="w-5 h-5 mb-1" />
                    <span className="text-[10px]">{i.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#1A1D26] dark:text-[#EDEDED]">Default View Modality</label>
            <Select
              defaultValue="kanban"
              onValueChange={(val) => setValue('defaultView', val as 'kanban' | 'list' | 'calendar')}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select view" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kanban">Kanban Board (Agile columns)</SelectItem>
                <SelectItem value="list">Linear List (High density table)</SelectItem>
                <SelectItem value="calendar">Calendar (Timeline schedule)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => dispatch(setCreateWorkspaceOpen(false))}
            >
              Cancel
            </Button>
            <Button type="submit">
              Create Workspace
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
