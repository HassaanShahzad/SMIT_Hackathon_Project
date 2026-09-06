import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useAppDispatch, useAppSelector } from '@/store';
import { login, signup, forgotPassword } from '@/store/slices/authSlice';
import { setTheme, AppTheme } from '@/store/slices/settingsSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  LogIn,
  UserPlus,
  KeyRound,
  Upload,
  X,
  CheckCircle2,
  Lock,
  Mail,
  User,
  Building,
  ArrowRight,
  Sun,
  Moon,
} from 'lucide-react';
import { toast } from 'sonner';

type AuthTab = 'login' | 'signup' | 'forgot';

interface AuthScreenProps {
  initialTab?: AuthTab;
}

interface LoginFormValues {
  email: string;
  password?: string;
  rememberMe?: boolean;
}

interface SignupFormValues {
  name: string;
  email: string;
  password?: string;
  confirmPassword?: string;
  department?: string;
}

interface ForgotPasswordFormValues {
  email: string;
  newPassword?: string;
  confirmNewPassword?: string;
}

export function AuthScreen({ initialTab = 'login' }: AuthScreenProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const mockUsers = useAppSelector((state) => state.auth.mockUsers);

  const [activeTab, setActiveTab] = useState<AuthTab>(initialTab);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const loginForm = useForm<LoginFormValues>({
    defaultValues: {
      email: '',
      password: '',
      rememberMe: true,
    },
  });

  const signupForm = useForm<SignupFormValues>({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      department: 'Engineering',
    },
  });

  const forgotForm = useForm<ForgotPasswordFormValues>({
    defaultValues: {
      email: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  const currentTheme = useAppSelector((state) => state.settings.theme);


  // Image Upload for Sign Up
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, WebP).');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Avatar file size must be less than 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(reader.result as string);
      toast.success('Profile image loaded.');
    };
    reader.onerror = () => {
      toast.error('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Submit Handlers
  const handleLoginSubmit = (data: LoginFormValues) => {
    const user = mockUsers.find(
      (u) => u.email.toLowerCase() === data.email.trim().toLowerCase()
    );

    if (!user) {
      toast.error('No account found with that email address.');
      return;
    }

    if (user.password && data.password && user.password !== data.password) {
      toast.error('Incorrect password. Please verify your credentials.');
      return;
    }

    dispatch(login({ email: data.email.trim(), password: data.password }));
    toast.success(`Welcome back, ${user.name}!`);
    if (user.role === 'Owner' || user.role === 'Admin') {
      router.push('/dashboard');
    } else {
      router.push('/kanban');
    }
  };

  const handleSignupSubmit = (data: SignupFormValues) => {
    if (!data.name.trim() || !data.email.trim()) {
      toast.error('Please provide your full name and email.');
      return;
    }

    if (data.password && data.password !== data.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    const existing = mockUsers.find(
      (u) => u.email.toLowerCase() === data.email.trim().toLowerCase()
    );
    if (existing) {
      toast.error('An account with this email already exists. Please log in.');
      return;
    }

    dispatch(
      signup({
        name: data.name.trim(),
        email: data.email.trim(),
        password: data.password || 'Member@123',
        avatarUrl: avatarPreview || undefined,
        department: data.department || 'Product Engineering',
      })
    );

    toast.success('Registration successful! Welcome to the workspace.');
    router.push('/kanban');
  };

  const handleForgotSubmit = (data: ForgotPasswordFormValues) => {
    if (!data.email.trim()) {
      toast.error('Please enter your account email.');
      return;
    }

    if (!data.newPassword || data.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long.');
      return;
    }

    if (data.newPassword !== data.confirmNewPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    const user = mockUsers.find(
      (u) => u.email.toLowerCase() === data.email.trim().toLowerCase()
    );
    if (!user) {
      toast.error('No account found with this email address.');
      return;
    }

    dispatch(
      forgotPassword({
        email: data.email.trim(),
        newPassword: data.newPassword,
      })
    );

    toast.success('Password updated successfully! Please sign in with your new password.');
    loginForm.setValue('email', data.email.trim());
    loginForm.setValue('password', data.newPassword);
    setActiveTab('login');
    router.push('/login');
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-[#F6F7FB] dark:bg-[#000000] text-[#1A1D26] dark:text-[#EDEDED] transition-colors border-0 outline-none ring-0">
      {/* Absolute Header Controls */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">

      </div>

      <div className="w-full max-w-md">
        {/* Branding Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#5D5FEF] text-white shadow-xl shadow-indigo-500/20 mb-3">
            <Sparkles className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[#1A1D26] dark:text-white">
            Workspace<span className="text-[#5D5FEF] dark:text-indigo-400">Pro</span>
          </h1>
          <p className="text-xs text-[#7D8592] dark:text-[#888888] mt-1 font-medium">
            Next-Generation Enterprise Task & Project Orchestration
          </p>
        </div>

        {/* Authentication Card */}
        <div className="bg-white dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-[#222222] rounded-3xl shadow-xl p-6 sm:p-8">
          {/* Tab Navigation */}
          <div className="flex bg-[#F6F7FB] dark:bg-[#111111] p-1 rounded-2xl mb-6 border border-[#E5E7EB] dark:border-[#222222]">
            <button
              onClick={() => {
                setActiveTab('login');
                router.push('/login');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${activeTab === 'login'
                ? 'bg-[#5D5FEF] text-white dark:bg-white dark:text-black shadow-md shadow-indigo-500/10'
                : 'text-[#7D8592] hover:text-[#1A1D26] dark:text-[#888888] dark:hover:text-white'
                }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setActiveTab('signup');
                router.push('/signup');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${activeTab === 'signup'
                ? 'bg-[#5D5FEF] text-white dark:bg-white dark:text-black shadow-md shadow-indigo-500/10'
                : 'text-[#7D8592] hover:text-[#1A1D26] dark:text-[#888888] dark:hover:text-white'
                }`}
            >
              Sign Up
            </button>
            <button
              onClick={() => setActiveTab('forgot')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${activeTab === 'forgot'
                ? 'bg-[#5D5FEF] text-white dark:bg-white dark:text-black shadow-md shadow-indigo-500/10'
                : 'text-[#7D8592] hover:text-[#1A1D26] dark:text-[#888888] dark:hover:text-white'
                }`}
            >
              Reset
            </button>
          </div>

          {/* TAB 1: SIGN IN */}
          {activeTab === 'login' && (
            <form onSubmit={loginForm.handleSubmit(handleLoginSubmit)} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#1A1D26] dark:text-slate-200 flex items-center gap-1.5 mb-1">
                  <Mail className="w-3.5 h-3.5 text-[#5D5FEF] dark:text-indigo-400" /> Email Address
                </label>
                <Input
                  type="email"
                  {...loginForm.register('email', { required: true })}
                  placeholder="name@company.com"
                  className="h-10 text-xs rounded-xl bg-[#F6F7FB] dark:bg-[#111111] border-[#E5E7EB] dark:border-[#222222] focus-visible:ring-[#5D5FEF]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-[#1A1D26] dark:text-slate-200 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-[#5D5FEF] dark:text-indigo-400" /> Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setActiveTab('forgot')}
                    className="text-[11px] font-semibold text-[#5D5FEF] dark:text-indigo-400 hover:underline"
                  >
                    Forgot?
                  </button>
                </div>
                <Input
                  type="password"
                  {...loginForm.register('password', { required: true })}
                  placeholder="••••••••"
                  className="h-10 text-xs rounded-xl bg-[#F6F7FB] dark:bg-[#111111] border-[#E5E7EB] dark:border-[#222222] focus-visible:ring-[#5D5FEF]"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-10 bg-[#5D5FEF] hover:bg-[#4E50E6] text-white dark:bg-white dark:text-black dark:hover:bg-slate-200 font-bold text-xs rounded-xl shadow-md transition-all mt-2"
              >
                <LogIn className="w-4 h-4 mr-2" /> Sign In to Workspace
              </Button>
            </form>
          )}

          {/* TAB 2: SIGN UP */}
          {activeTab === 'signup' && (
            <form onSubmit={signupForm.handleSubmit(handleSignupSubmit)} className="space-y-3.5">
              {/* Profile Image / Gallery Upload */}
              <div className="flex items-center gap-4 p-3 rounded-2xl bg-[#F6F7FB] dark:bg-[#111111] border border-[#E5E7EB] dark:border-[#222222]">
                <Avatar className="w-14 h-14 ring-2 ring-[#5D5FEF] shrink-0">
                  <AvatarImage src={avatarPreview || undefined} />
                  <AvatarFallback className="bg-[#5D5FEF] text-white font-bold text-sm">
                    {signupForm.watch('name')?.slice(0, 2).toUpperCase() || 'AV'}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[#1A1D26] dark:text-white">
                    Profile Picture
                  </p>
                  <p className="text-[11px] text-[#7D8592] dark:text-[#888888]">
                    Upload custom photo or gallery image
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageFileChange}
                      accept="image/*"
                      className="hidden"
                      id="avatar-file-input"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-7 text-[11px] px-2.5 rounded-lg border-[#E5E7EB] dark:border-[#222222]"
                    >
                      <Upload className="w-3 h-3 mr-1" /> Choose File
                    </Button>
                    {avatarPreview && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveAvatar}
                        className="h-7 text-[11px] px-2 text-rose-500 hover:text-rose-600"
                      >
                        <X className="w-3 h-3 mr-0.5" /> Remove
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#1A1D26] dark:text-slate-200 flex items-center gap-1.5 mb-1">
                  <User className="w-3.5 h-3.5 text-[#5D5FEF] dark:text-indigo-400" /> Full Name
                </label>
                <Input
                  {...signupForm.register('name', { required: true })}
                  placeholder="Enter Name"
                  className="h-9 text-xs rounded-xl bg-[#F6F7FB] dark:bg-[#111111] border-[#E5E7EB] dark:border-[#222222] focus-visible:ring-[#5D5FEF]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#1A1D26] dark:text-slate-200 flex items-center gap-1.5 mb-1">
                  <Mail className="w-3.5 h-3.5 text-[#5D5FEF] dark:text-indigo-400" /> Work Email
                </label>
                <Input
                  type="email"
                  {...signupForm.register('email', { required: true })}
                  placeholder="abc@gmail.com"
                  className="h-9 text-xs rounded-xl bg-[#F6F7FB] dark:bg-[#111111] border-[#E5E7EB] dark:border-[#222222] focus-visible:ring-[#5D5FEF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-[#1A1D26] dark:text-slate-200 flex items-center gap-1.5 mb-1">
                    <Lock className="w-3.5 h-3.5 text-[#5D5FEF] dark:text-indigo-400" /> Password
                  </label>
                  <Input
                    type="password"
                    {...signupForm.register('password', { required: true })}
                    placeholder="••••••••"
                    className="h-9 text-xs rounded-xl bg-[#F6F7FB] dark:bg-[#111111] border-[#E5E7EB] dark:border-[#222222] focus-visible:ring-[#5D5FEF]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#1A1D26] dark:text-slate-200 flex items-center gap-1.5 mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#1BD9B2]" /> Confirm
                  </label>
                  <Input
                    type="password"
                    {...signupForm.register('confirmPassword', { required: true })}
                    placeholder="••••••••"
                    className="h-9 text-xs rounded-xl bg-[#F6F7FB] dark:bg-[#111111] border-[#E5E7EB] dark:border-[#222222] focus-visible:ring-[#5D5FEF]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#1A1D26] dark:text-slate-200 flex items-center gap-1.5 mb-1">
                  <Building className="w-3.5 h-3.5 text-[#5D5FEF] dark:text-indigo-400" /> Department
                </label>
                <Input
                  {...signupForm.register('department')}
                  placeholder="e.g. Product Engineering, Marketing"
                  className="h-9 text-xs rounded-xl bg-[#F6F7FB] dark:bg-[#111111] border-[#E5E7EB] dark:border-[#222222] focus-visible:ring-[#5D5FEF]"
                />
              </div>

              <p className="text-[11px] text-[#7D8592] dark:text-[#888888] leading-snug">
                Note: All new accounts are automatically registered with standard{' '}
                <strong className="text-[#5D5FEF] dark:text-indigo-400">Member</strong> privileges.
              </p>

              <Button
                type="submit"
                className="w-full h-10 bg-[#5D5FEF] hover:bg-[#4E50E6] text-white dark:bg-white dark:text-black dark:hover:bg-slate-200 font-bold text-xs rounded-xl shadow-md transition-all mt-1"
              >
                <UserPlus className="w-4 h-4 mr-2" /> Create My Account
              </Button>
            </form>
          )}

          {/* TAB 3: FORGOT PASSWORD */}
          {activeTab === 'forgot' && (
            <form onSubmit={forgotForm.handleSubmit(handleForgotSubmit)} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#1A1D26] dark:text-slate-200 flex items-center gap-1.5 mb-1">
                  <Mail className="w-3.5 h-3.5 text-[#5D5FEF] dark:text-indigo-400" /> Account Email
                </label>
                <Input
                  type="email"
                  {...forgotForm.register('email', { required: true })}
                  placeholder="name@company.com"
                  className="h-10 text-xs rounded-xl bg-[#F6F7FB] dark:bg-[#111111] border-[#E5E7EB] dark:border-[#222222] focus-visible:ring-[#5D5FEF]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#1A1D26] dark:text-slate-200 flex items-center gap-1.5 mb-1">
                  <KeyRound className="w-3.5 h-3.5 text-[#5D5FEF] dark:text-indigo-400" /> New Password
                </label>
                <Input
                  type="password"
                  {...forgotForm.register('newPassword', { required: true })}
                  placeholder="••••••••"
                  className="h-10 text-xs rounded-xl bg-[#F6F7FB] dark:bg-[#111111] border-[#E5E7EB] dark:border-[#222222] focus-visible:ring-[#5D5FEF]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#1A1D26] dark:text-slate-200 flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#1BD9B2]" /> Confirm New Password
                </label>
                <Input
                  type="password"
                  {...forgotForm.register('confirmNewPassword', { required: true })}
                  placeholder="••••••••"
                  className="h-10 text-xs rounded-xl bg-[#F6F7FB] dark:bg-[#111111] border-[#E5E7EB] dark:border-[#222222] focus-visible:ring-[#5D5FEF]"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-10 bg-[#5D5FEF] hover:bg-[#4E50E6] text-white dark:bg-white dark:text-black dark:hover:bg-slate-200 font-bold text-xs rounded-xl shadow-md transition-all mt-2"
              >
                <KeyRound className="w-4 h-4 mr-2" /> Reset Password & Return to Login
              </Button>
            </form>
          )}
        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-[#9C9FA6] mt-6">
          🔒 Secured by local browser persistence &bull; No external data leaks
        </p>
      </div>
    </div>
  );
}
