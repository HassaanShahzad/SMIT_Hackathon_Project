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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppDispatch, useAppSelector } from '@/store';
import { inviteMember } from '@/store/slices/workspaceSlice';
import { setInviteMemberOpen } from '@/store/slices/uiSlice';
import { logActivity } from '@/store/slices/activitySlice';
import { addNotification } from '@/store/slices/notificationSlice';
import { canInviteMembers } from '@/lib/permissions';
import { UserRole } from '@/types/auth';
import { UserPlus, Mail, Shield } from 'lucide-react';

interface InviteFormInputs {
  email: string;
  role: UserRole;
}

export function InviteMemberDialog() {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state) => state.ui.isInviteMemberOpen);
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const activeWorkspaceId = useAppSelector((state) => state.workspace.activeWorkspaceId);
  const mockUsers = useAppSelector((state) => state.auth.mockUsers);
  const workspaces = useAppSelector((state) => state.workspace.workspaces);

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<InviteFormInputs>({
    defaultValues: {
      email: '',
      role: 'Member',
    },
  });

  const onSubmit = (data: InviteFormInputs) => {
    if (!currentUser) {
      toast.error('Authentication required');
      return;
    }

    if (!canInviteMembers(currentUser.role)) {
      toast.error(`Permission denied: ${currentUser.role}s cannot invite workspace members.`);
      return;
    }

    // Check if user exists in mockUsers or create mock user
    let user = mockUsers.find((u) => u.email.toLowerCase() === data.email.toLowerCase());
    const targetUserId = user ? user.id : `user_${Date.now()}`;

    // Check if already member
    const alreadyMember = activeWorkspace?.members.some((m) => m.userId === targetUserId);
    if (alreadyMember) {
      toast.warning(`${data.email} is already a member of this workspace`);
      return;
    }

    dispatch(
      inviteMember({
        workspaceId: activeWorkspaceId,
        userId: targetUserId,
        role: data.role,
      })
    );

    dispatch(
      logActivity({
        workspaceId: activeWorkspaceId,
        userId: currentUser.id,
        action: 'invited member',
        details: `Invited ${data.email} as ${data.role}`,
      })
    );

    if (user) {
      dispatch(
        addNotification({
          recipientId: user.id,
          senderId: currentUser.id,
          type: 'project_update',
          title: 'Workspace Invitation',
          message: `${currentUser.name} invited you to join "${activeWorkspace?.name}" as ${data.role}`,
        })
      );
    }

    toast.success(`Invitation sent to ${data.email} as ${data.role}!`);
    reset();
    dispatch(setInviteMemberOpen(false));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => dispatch(setInviteMemberOpen(open))}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <UserPlus className="w-5 h-5 text-indigo-400" />
            <span>Invite Team Member</span>
          </DialogTitle>
          <DialogDescription>
            Add collaborators to <strong>{activeWorkspace?.name || 'this workspace'}</strong>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div>
            <label className="text-xs font-medium text-slate-300">Email Address *</label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                {...register('email', { required: 'Email is required' })}
                placeholder="colleague@acme.com"
                type="email"
                className="pl-9"
                error={errors.email?.message}
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Tip: You can use existing mock user emails (e.g. <code>emily.watson@acme.com</code>)
            </p>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300">Workspace Role</label>
            <Select
              defaultValue="Member"
              onValueChange={(val) => setValue('role', val as UserRole)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Admin">Admin (Can manage projects & invite team)</SelectItem>
                <SelectItem value="Member">Member (Can create & update tasks)</SelectItem>
                <SelectItem value="Viewer">Viewer (Read-only access)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-3 flex items-start space-x-2.5">
            <Shield className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
            <div className="text-xs text-slate-300 leading-relaxed">
              Invited members gain immediate access to all public projects and tasks in this workspace.
            </div>
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => dispatch(setInviteMemberOpen(false))}
            >
              Cancel
            </Button>
            <Button type="submit">
              Send Invitation
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
