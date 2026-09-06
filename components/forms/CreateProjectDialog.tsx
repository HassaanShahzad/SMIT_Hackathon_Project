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
import { createProject } from '@/store/slices/projectSlice';
import { setCreateProjectOpen } from '@/store/slices/uiSlice';
import { logActivity } from '@/store/slices/activitySlice';
import { ProjectColor, ProjectFormValues, ProjectTemplate } from '@/types/project';
import { canManageProjects } from '@/lib/permissions';
import { Folder, Boxes, Smartphone, ShieldCheck, Check, Sparkles } from 'lucide-react';

const COLORS: { label: string; value: ProjectColor; bg: string }[] = [
  { label: 'Indigo', value: 'indigo', bg: 'bg-indigo-500' },
  { label: 'Emerald', value: 'emerald', bg: 'bg-emerald-500' },
  { label: 'Purple', value: 'purple', bg: 'bg-purple-500' },
  { label: 'Rose', value: 'rose', bg: 'bg-rose-500' },
  { label: 'Cyan', value: 'cyan', bg: 'bg-cyan-500' },
  { label: 'Amber', value: 'amber', bg: 'bg-amber-500' },
];

const TEMPLATES: {
  id: ProjectTemplate;
  title: string;
  desc: string;
  icon: typeof Folder;
}[] = [
  {
    id: 'saas_launch',
    title: 'SaaS Launch Roadmap',
    desc: 'Architecture, alpha testing, and production rollout track',
    icon: Boxes,
  },
  {
    id: 'sprint_tracker',
    title: 'Agile Sprint Tracker',
    desc: 'Bi-weekly sprint backlog, in-flight tickets, and QA gates',
    icon: Smartphone,
  },
  {
    id: 'bug_triage',
    title: 'Bug Triage & Quality',
    desc: 'Regression fixes, edge-case remediation, and telemetry',
    icon: ShieldCheck,
  },
  {
    id: 'custom',
    title: 'Custom Project',
    desc: 'Blank canvas for bespoke workflows and tailored stages',
    icon: Folder,
  },
];

export function CreateProjectDialog() {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state) => state.ui.isCreateProjectOpen);
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const activeWorkspaceId = useAppSelector((state) => state.workspace.activeWorkspaceId);
  const workspaces = useAppSelector((state) => state.workspace.workspaces);
  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ProjectFormValues>({
    defaultValues: {
      name: '',
      key: '',
      description: '',
      icon: 'Folder',
      color: 'indigo',
      template: 'saas_launch',
    },
  });

  const selectedColor = watch('color');
  const selectedTemplate = watch('template');

  // Auto-generate project key from name if not manually set
  const onNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const autoKey = name
      .replace(/[^a-zA-Z]/g, '')
      .substring(0, 3)
      .toUpperCase();
    setValue('name', name);
    if (!watch('key') || watch('key').length <= 3) {
      setValue('key', autoKey);
    }
  };

  const onSubmit = (data: ProjectFormValues) => {
    if (!currentUser) {
      toast.error('Authentication required');
      return;
    }

    if (!canManageProjects(currentUser.role, activeWorkspace, currentUser.id)) {
      toast.error(`Permission denied: ${currentUser.role}s cannot create projects in this workspace.`);
      return;
    }

    dispatch(
      createProject({
        ...data,
        workspaceId: activeWorkspaceId,
        creatorId: currentUser.id,
      })
    );

    dispatch(
      logActivity({
        workspaceId: activeWorkspaceId,
        userId: currentUser.id,
        action: 'created project',
        details: `Created project [${data.key}] ${data.name}`,
      })
    );

    toast.success(`Project "${data.name}" [${data.key}] created successfully!`);
    reset();
    dispatch(setCreateProjectOpen(false));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => dispatch(setCreateProjectOpen(open))}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Group tasks into milestones, sprints, and product roadmaps.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-medium text-slate-300">Project Name *</label>
              <Input
                {...register('name', { required: 'Project name is required' })}
                onChange={onNameChange}
                placeholder="e.g. NextGen Web App"
                className="mt-1"
                error={errors.name?.message}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-300">Prefix Key *</label>
              <Input
                {...register('key', {
                  required: 'Key is required',
                  maxLength: { value: 6, message: 'Max 6 chars' },
                })}
                placeholder="e.g. PRJ"
                className="mt-1 uppercase font-mono tracking-wider"
                error={errors.key?.message}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300">Description</label>
            <Textarea
              {...register('description')}
              placeholder="What problem or initiative is this project solving?"
              className="mt-1 min-h-[60px]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#1A1D26] dark:text-[#EDEDED]">Template</label>
            <div className="grid grid-cols-2 gap-2 mt-1.5">
              {TEMPLATES.map((tmpl) => {
                const isSelected = selectedTemplate === tmpl.id;
                const IconComponent = tmpl.icon;
                return (
                  <div
                    key={tmpl.id}
                    onClick={() => setValue('template', tmpl.id)}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#5D5FEF] bg-[#ECEBFF] text-[#1A1D26] dark:bg-[#1A1A1A] dark:text-white font-semibold'
                        : 'border-[#E5E7EB] dark:border-[#222222] bg-[#F6F7FB] dark:bg-[#111111] text-[#7D8592] dark:text-[#888888] hover:text-[#1A1D26] dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-2 font-medium text-xs mb-1">
                      <IconComponent className="w-3.5 h-3.5 text-[#5D5FEF]" />
                      <span>{tmpl.title}</span>
                    </div>
                    <div className="text-[11px] text-[#7D8592] dark:text-[#888888] leading-tight">{tmpl.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300">Accent Color</label>
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

          <div className="pt-2 flex justify-end space-x-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => dispatch(setCreateProjectOpen(false))}
            >
              Cancel
            </Button>
            <Button type="submit">
              <Sparkles className="mr-1.5 h-4 w-4" /> Create Project
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
