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
import { UserAvatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAppDispatch, useAppSelector } from '@/store';
import { login, signup, updateProfile, switchUser } from '@/store/slices/authSlice';
import { setAuthModalOpen } from '@/store/slices/uiSlice';
import { UserRole } from '@/types/auth';
import { User, LogIn, UserPlus, Check, Sparkles, Shield } from 'lucide-react';

interface LoginFormInputs {
  email: string;
}

interface SignupFormInputs {
  name: string;
  email: string;
  role: UserRole;
  department: string;
}

interface ProfileFormInputs {
  name: string;
  email: string;
  department: string;
}

export function AuthModal() {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state) => state.ui.isAuthModalOpen);
  const mode = useAppSelector((state) => state.ui.authModalMode);
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const mockUsers = useAppSelector((state) => state.auth.mockUsers);

  // Login form
  const loginForm = useForm<LoginFormInputs>({
    defaultValues: {
      email: currentUser?.email || '',
    },
  });

  // Signup form
  const signupForm = useForm<SignupFormInputs>({
    defaultValues: {
      name: '',
      email: '',
      role: 'Member',
      department: 'Product Engineering',
    },
  });

  // Profile form
  const profileForm = useForm<ProfileFormInputs>({
    defaultValues: {
      name: currentUser?.name || '',
      email: currentUser?.email || '',
      department: currentUser?.department || '',
    },
  });

  // Keep profile form in sync when currentUser changes
  React.useEffect(() => {
    if (currentUser) {
      profileForm.reset({
        name: currentUser.name,
        email: currentUser.email,
        department: currentUser.department || '',
      });
    }
  }, [currentUser, profileForm]);

  const onLoginSubmit = (data: LoginFormInputs) => {
    const found = mockUsers.find((u) => u.email.toLowerCase() === data.email.toLowerCase());
    if (!found) {
      toast.error(`No user found with email "${data.email}".`);
      return;
    }
    dispatch(login({ email: data.email }));
    toast.success(`Welcome back, ${found.name}! Logged in as ${found.role}.`);
    dispatch(setAuthModalOpen({ open: false }));
  };

  const onSignupSubmit = (data: SignupFormInputs) => {
    if (!data.name.trim() || !data.email.trim()) {
      toast.error('Please enter both name and email');
      return;
    }
    const exists = mockUsers.some((u) => u.email.toLowerCase() === data.email.toLowerCase());
    if (exists) {
      toast.error('A user with this email already exists');
      return;
    }
    dispatch(signup({ name: data.name, email: data.email, department: data.department }));
    toast.success(`Account created successfully! Welcome to Workspace Manager.`);
    dispatch(setAuthModalOpen({ open: false }));
  };

  const onProfileSubmit = (data: ProfileFormInputs) => {
    dispatch(updateProfile(data));
    toast.success('User profile updated successfully!');
    dispatch(setAuthModalOpen({ open: false }));
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => dispatch(setAuthModalOpen({ open }))}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center space-x-2 text-indigo-400 mb-1">
            <Shield className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">Client Authentication & Roles</span>
          </div>
          <DialogTitle>
            {mode === 'login' && 'Sign In to Workspace'}
            {mode === 'signup' && 'Create Workspace Account'}
            {mode === 'profile' && 'Edit User Profile'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'login' && 'Enter your email or select any team persona below to test roles & permissions.'}
            {mode === 'signup' && 'Create a new local mock user persona.'}
            {mode === 'profile' && 'Update your display profile information stored in localStorage.'}
          </DialogDescription>
        </DialogHeader>

        {mode === 'login' && (
          <div className="space-y-4 py-2">
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-300">Email Address</label>
                <Input
                  {...loginForm.register('email', { required: true })}
                  placeholder="name@company.com"
                  type="email"
                  className="mt-1"
                />
              </div>
              <Button type="submit" className="w-full">
                <LogIn className="mr-2 h-4 w-4" /> Sign In
              </Button>
            </form>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => dispatch(setAuthModalOpen({ open: true, mode: 'signup' }))}
                className="text-xs text-indigo-400 hover:underline inline-flex items-center"
              >
                <UserPlus className="mr-1 h-3 w-3" /> Need a new account? Create one
              </button>
            </div>
          </div>
        )}

        {mode === 'signup' && (
          <form onSubmit={signupForm.handleSubmit(onSignupSubmit)} className="space-y-3 py-2">
            <div>
              <label className="text-xs font-medium text-slate-300">Full Name</label>
              <Input
                {...signupForm.register('name', { required: 'Name is required' })}
                placeholder="Jordan Miller"
                className="mt-1"
                error={signupForm.formState.errors.name?.message}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-300">Email Address</label>
              <Input
                {...signupForm.register('email', { required: 'Email is required' })}
                placeholder="jordan.miller@acme.com"
                type="email"
                className="mt-1"
                error={signupForm.formState.errors.email?.message}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-300">Role Assignment</label>
              <Select
                defaultValue="Member"
                onValueChange={(val) => signupForm.setValue('role', val as UserRole)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Owner">Owner (Full Permissions)</SelectItem>
                  <SelectItem value="Admin">Admin (Manage Projects & Members)</SelectItem>
                  <SelectItem value="Member">Member (Manage Tasks)</SelectItem>
                  <SelectItem value="Viewer">Viewer (Read Only)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-300">Department / Team</label>
              <Input
                {...signupForm.register('department')}
                placeholder="Engineering, Design, Marketing..."
                className="mt-1"
              />
            </div>
            <div className="pt-2 flex items-center space-x-2 justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={() => dispatch(setAuthModalOpen({ open: true, mode: 'login' }))}
              >
                Back to Sign In
              </Button>
              <Button type="submit">
                <Sparkles className="mr-1.5 h-4 w-4" /> Create Persona
              </Button>
            </div>
          </form>
        )}

        {mode === 'profile' && (
          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-3 py-2">
            <div>
              <label className="text-xs font-medium text-slate-300">Full Name</label>
              <Input
                {...profileForm.register('name', { required: 'Name is required' })}
                className="mt-1"
                error={profileForm.formState.errors.name?.message}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-300">Email Address</label>
              <Input
                {...profileForm.register('email', { required: 'Email is required' })}
                type="email"
                className="mt-1"
                error={profileForm.formState.errors.email?.message}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-300">Department</label>
              <Input
                {...profileForm.register('department')}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-300">Role</label>
              <div className="mt-1 flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="text-xs font-semibold bg-[#5D5FEF]/10 text-[#5D5FEF] border-[#5D5FEF]/30"
                >
                  {currentUser?.role || 'Member'}
                </Badge>
                <span className="text-[11px] text-slate-400">
                  (Assigned by Owner/Admin in Dashboard)
                </span>
              </div>
            </div>
            <div className="pt-2 flex justify-end space-x-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => dispatch(setAuthModalOpen({ open: false }))}
              >
                Cancel
              </Button>
              <Button type="submit">
                <Check className="mr-1.5 h-4 w-4" /> Save Profile
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
