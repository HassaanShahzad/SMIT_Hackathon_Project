'use client';

import React, { useRef } from 'react';
import { toast } from 'sonner';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserAvatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  setTheme,
  setCompactMode,
  setSimulateNetworkDelay,
  setDelayMs,
  updateNotificationPreferences,
  AppTheme,
} from '@/store/slices/settingsSlice';
import {
  updateWorkspace,
  removeMember,
  updateMemberRole,
  setActiveWorkspace,
  inviteMember,
} from '@/store/slices/workspaceSlice';
import { exportAllData, importAllData, clearData, seedInitialDataIfEmpty } from '@/lib/storage';
import { canEditWorkspace, canAccessDangerZone, canManageWorkspace } from '@/lib/permissions';
import { UserRole } from '@/types/auth';
import {
  Settings,
  Download,
  Upload,
  AlertTriangle,
  RotateCcw,
  Moon,
  Sun,
  Laptop,
  Trash2,
  UserPlus,
  ShieldAlert,
  Wifi,
} from 'lucide-react';

export function SettingsView() {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const activeWorkspaceId = useAppSelector((state) => state.workspace.activeWorkspaceId);
  const workspaces = useAppSelector((state) => state.workspace.workspaces);
  const mockUsers = useAppSelector((state) => state.auth.mockUsers);
  const settings = useAppSelector((state) => state.settings);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter workspaces based on user role and membership for data isolation
  const visibleWorkspaces = React.useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'Owner' || currentUser.role === 'Admin') {
      return workspaces;
    }
    return workspaces.filter(
      (w) => w.ownerId === currentUser.id || w.members.some((m) => m.userId === currentUser.id)
    );
  }, [workspaces, currentUser]);

  const [selectedWorkspaceId, setSelectedWorkspaceId] = React.useState(activeWorkspaceId);
  const activeWorkspace = visibleWorkspaces.find((w) => w.id === selectedWorkspaceId) || visibleWorkspaces.find((w) => w.id === activeWorkspaceId) || visibleWorkspaces[0];

  const [wsName, setWsName] = React.useState(activeWorkspace?.name || '');
  const [inviteUserId, setInviteUserId] = React.useState('');
  const [inviteRole, setInviteRole] = React.useState<'Member' | 'Viewer'>('Member');

  React.useEffect(() => {
    if (activeWorkspace) {
      setWsName(activeWorkspace.name);
    }
  }, [activeWorkspace]);

  React.useEffect(() => {
    if (activeWorkspaceId) {
      setSelectedWorkspaceId(activeWorkspaceId);
    }
  }, [activeWorkspaceId]);

  const isPrivileged =
    currentUser?.role === 'Owner' ||
    currentUser?.role === 'Admin' ||
    (currentUser?.role === 'Member' && activeWorkspace?.ownerId === currentUser?.id);

  const handleSaveGeneral = () => {
    if (!currentUser || !canEditWorkspace(currentUser.role, activeWorkspace, currentUser.id)) {
      toast.error(`Permission denied: ${currentUser?.role || 'User'}s cannot edit this workspace's settings.`);
      return;
    }
    if (activeWorkspace) {
      dispatch(
        updateWorkspace({
          id: activeWorkspace.id,
          updates: { name: wsName },
        })
      );
      toast.success('Workspace settings updated successfully!');
    }
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteUserId || !activeWorkspace) return;
    dispatch(
      inviteMember({
        workspaceId: activeWorkspace.id,
        userId: inviteUserId,
        role: inviteRole,
      })
    );
    toast.success(`Invited user as ${inviteRole}`);
    setInviteUserId('');
  };

  const availableUsersToInvite = mockUsers.filter(
    (u) => !activeWorkspace?.members.some((m) => m.userId === u.id)
  );

  const handleExportData = () => {
    try {
      const dataStr = exportAllData();
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `workspace-manager-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Workspace backup exported successfully!');
    } catch {
      toast.error('Failed to export data');
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const result = importAllData(content);
      if (result.success) {
        toast.success(result.message);
        setTimeout(() => {
          window.location.reload();
        }, 800);
      } else {
        toast.error(result.message);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleResetData = () => {
    if (!canAccessDangerZone(currentUser?.role, activeWorkspace, currentUser?.id)) {
      toast.error(`Permission denied: You do not have permission to reset workspace data.`);
      return;
    }
    clearData();
    seedInitialDataIfEmpty();
    toast.success('Data reset successfully! Restoring clean state...');
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="pb-4 border-b border-[#F0F1F5] dark:border-[#222222]">
        <div className="flex items-center gap-2 mb-1">
          <Settings className="w-5 h-5 text-[#5D5FEF] dark:text-indigo-400" />
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1A1D26] dark:text-white">
            Workspace Settings & Preferences
          </h1>
        </div>
        <p className="text-xs text-[#7D8592] dark:text-[#888888]">
          Configure workspace parameters, manage team roles, simulation options, and backup configurations.
        </p>
      </div>

      {/* Workspace Selector Bar */}
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-[#F0F1F5] dark:border-[#222222]">
        <div className="text-xs font-semibold text-[#1A1D26] dark:text-white">
          Active Workspace Configuration:
        </div>
        <Select
          value={selectedWorkspaceId}
          onValueChange={(val) => {
            setSelectedWorkspaceId(val);
            dispatch(setActiveWorkspace(val));
          }}
        >
          <SelectTrigger className="w-56 h-8 text-xs bg-[#F6F7FB] dark:bg-[#111111] border-[#F0F1F5] dark:border-[#222222]">
            <SelectValue placeholder="Select Workspace" />
          </SelectTrigger>
          <SelectContent>
            {visibleWorkspaces.map((ws) => (
              <SelectItem key={ws.id} value={ws.id} className="text-xs">
                {ws.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!isPrivileged ? (
        <div className="py-16 px-4 text-center space-y-3 bg-white dark:bg-[#0A0A0A] rounded-2xl border border-[#F0F1F5] dark:border-[#222222]">
          <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto" />
          <h3 className="text-lg font-bold text-[#1A1D26] dark:text-white">
            Access Restricted
          </h3>
          <p className="text-xs text-[#7D8592] dark:text-[#888888] max-w-sm mx-auto">
            Workspace settings, team management, and dangerous operations are strictly restricted to Workspace Owners and Administrators.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#0A0A0A] rounded-2xl border border-[#F0F1F5] dark:border-[#222222] p-6">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid grid-cols-5 w-full bg-[#F6F7FB] dark:bg-[#111111] p-1 rounded-xl">
              <TabsTrigger value="general" className="text-xs rounded-lg">General</TabsTrigger>
              <TabsTrigger value="team" className="text-xs rounded-lg">Members</TabsTrigger>
              <TabsTrigger value="network" className="text-xs rounded-lg">Simulation</TabsTrigger>
              <TabsTrigger value="backup" className="text-xs rounded-lg">Import/Export</TabsTrigger>
              <TabsTrigger value="danger" className="text-xs rounded-lg">Danger Zone</TabsTrigger>
            </TabsList>

            {/* 1. General Tab */}
            <TabsContent value="general" className="space-y-5 py-4">
              <div>
                <label className="text-xs font-semibold text-[#1A1D26] dark:text-slate-200">Workspace Name</label>
                <div className="flex space-x-2 mt-1.5 max-w-md">
                  <Input
                    value={wsName}
                    onChange={(e) => setWsName(e.target.value)}
                    placeholder="Workspace Name"
                    className="bg-[#F6F7FB] dark:bg-[#111111] border-[#F0F1F5] dark:border-[#222222] text-xs h-9"
                  />
                  <Button size="sm" className="bg-[#5D5FEF] hover:bg-[#4E50E6] text-white text-xs h-9 px-4" onClick={handleSaveGeneral}>
                    Save
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#1A1D26] dark:text-slate-200">Theme Mode</label>
                <div className="grid grid-cols-3 gap-2 mt-1.5 max-w-md">
                  {[
                    { id: 'light', label: 'Light Mode', icon: Sun },
                    { id: 'dark', label: 'Dark Mode', icon: Moon },
                    { id: 'system', label: 'System', icon: Laptop },
                  ].map((t) => {
                    const IconComp = t.icon;
                    const isSelected = settings.theme === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => dispatch(setTheme(t.id as AppTheme))}
                        className={`flex items-center justify-center space-x-2 p-2.5 rounded-xl border transition-all ${
                          isSelected
                            ? 'border-[#5D5FEF] bg-[#ECEBFF] text-[#5D5FEF] dark:bg-[#1A1A1A] dark:text-white dark:border-[#5D5FEF] font-semibold shadow-sm'
                            : 'border-[#F0F1F5] dark:border-[#222222] bg-[#F6F7FB] dark:bg-[#111111] text-[#7D8592] dark:text-[#888888] hover:text-[#1A1D26] dark:hover:text-white'
                        }`}
                      >
                        <IconComp className="w-4 h-4" />
                        <span className="text-xs">{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl border border-[#F0F1F5] dark:border-[#222222] bg-[#F6F7FB] dark:bg-[#111111]/50">
                <div>
                  <div className="text-xs font-semibold text-[#1A1D26] dark:text-slate-200">Compact Density View</div>
                  <div className="text-[11px] text-[#7D8592] dark:text-[#888888]">Reduce spacing for high-density information display</div>
                </div>
                <Switch
                  checked={settings.compactMode}
                  onCheckedChange={(checked) => dispatch(setCompactMode(checked))}
                />
              </div>

              <div className="space-y-3 pt-3 border-t border-[#F0F1F5] dark:border-[#222222]">
                <label className="text-xs font-semibold text-[#1A1D26] dark:text-slate-200">Notification Preferences</label>
                <div className="space-y-2 max-w-md">
                  {[
                    { key: 'taskAssigned', label: 'Task Assignment Notifications' },
                    { key: 'mentions', label: 'Comment @Mentions Alerts' },
                    { key: 'dueDateReminders', label: 'Due Date Approaching Reminders' },
                    { key: 'statusChanges', label: 'Task Lifecycle Status Changes' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between text-xs text-[#1A1D26] dark:text-slate-300">
                      <span>{item.label}</span>
                      <Switch
                        checked={!!settings.notificationPreferences[item.key as keyof typeof settings.notificationPreferences]}
                        onCheckedChange={(val) =>
                          dispatch(updateNotificationPreferences({ [item.key]: val }))
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* 2. Team Tab */}
            <TabsContent value="team" className="space-y-4 py-4">
              <div className="p-4 rounded-xl border border-[#ECEBFF] dark:border-[#222222] bg-[#F6F7FB] dark:bg-[#111111] space-y-3">
                <div className="flex items-center space-x-2 text-xs font-semibold text-[#5D5FEF] dark:text-indigo-400">
                  <UserPlus className="w-4 h-4" />
                  <span>Invite Teammate to Workspace</span>
                </div>
                <form onSubmit={handleInvite} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Select value={inviteUserId} onValueChange={setInviteUserId}>
                    <SelectTrigger className="text-xs bg-white dark:bg-[#0A0A0A] border-[#F0F1F5] dark:border-[#222222]">
                      <SelectValue placeholder="Select user..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUsersToInvite.map((u) => (
                        <SelectItem key={u.id} value={u.id} className="text-xs">
                          {u.name} ({u.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={inviteRole}
                    onValueChange={(val) => setInviteRole(val as 'Member' | 'Viewer')}
                  >
                    <SelectTrigger className="text-xs bg-white dark:bg-[#0A0A0A] border-[#F0F1F5] dark:border-[#222222]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Member">Member (Read & Write)</SelectItem>
                      <SelectItem value="Viewer">Viewer (Read-only)</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    type="submit"
                    size="sm"
                    disabled={!inviteUserId}
                    className="bg-[#5D5FEF] hover:bg-[#4E50E6] text-white text-xs"
                  >
                    Send Invitation
                  </Button>
                </form>
              </div>

              <div>
                <h4 className="text-xs font-bold text-[#1A1D26] dark:text-slate-200 uppercase tracking-wider mb-2">
                  Current Workspace Members
                </h4>
                <div className="divide-y divide-[#F0F1F5] dark:divide-[#222222] border border-[#F0F1F5] dark:border-[#222222] rounded-xl overflow-hidden">
                  {activeWorkspace?.members.map((member) => {
                    const user = mockUsers.find((u) => u.id === member.userId);
                    if (!user) return null;
                    const isOwner = activeWorkspace.ownerId === member.userId;

                    return (
                      <div key={member.userId} className="flex items-center justify-between p-3 bg-white dark:bg-[#0A0A0A]">
                        <div className="flex items-center space-x-3">
                          <UserAvatar name={user.name} avatarUrl={user.avatarUrl} size="default" />
                          <div>
                            <div className="text-xs font-semibold text-[#1A1D26] dark:text-slate-200 flex items-center space-x-2">
                              <span>{user.name}</span>
                              {isOwner && (
                                <Badge variant="secondary" className="text-[10px] bg-[#5D5FEF] text-white">
                                  Owner
                                </Badge>
                              )}
                            </div>
                            <div className="text-[11px] text-[#7D8592] dark:text-[#888888]">{user.email}</div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {!isOwner ? (
                            <>
                              <Select
                                defaultValue={member.role}
                                onValueChange={(val) =>
                                  dispatch(
                                    updateMemberRole({
                                      workspaceId: activeWorkspace.id,
                                      userId: member.userId,
                                      role: val as UserRole,
                                    })
                                  )
                                }
                              >
                                <SelectTrigger className="h-7 w-28 text-xs bg-[#F6F7FB] dark:bg-[#111111] border-[#F0F1F5] dark:border-[#222222]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {currentUser?.role === 'Owner' && (
                                    <SelectItem value="Admin">Admin</SelectItem>
                                  )}
                                  <SelectItem value="Member">Member</SelectItem>
                                  <SelectItem value="Viewer">Viewer</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-slate-400 hover:text-rose-500"
                                onClick={() =>
                                  dispatch(
                                    removeMember({
                                      workspaceId: activeWorkspace.id,
                                      userId: member.userId,
                                    })
                                  )
                                }
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </>
                          ) : (
                            <span className="text-xs text-[#7D8592] font-medium mr-2">Workspace Creator</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            {/* 3. Network & Simulation Tab */}
            <TabsContent value="network" className="space-y-4 py-4">
              <div className="p-3.5 rounded-xl border border-indigo-500/20 bg-indigo-500/5 flex items-start space-x-3">
                <Wifi className="w-5 h-5 text-indigo-400 mt-0.5 shrink-0" />
                <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Because this application runs entirely client-side on <strong>localStorage</strong>, this section lets you simulate network latency and simulated rollback failures to test optimistic UI updates.
                </div>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl border border-[#F0F1F5] dark:border-[#222222] bg-[#F6F7FB] dark:bg-[#111111]">
                <div>
                  <div className="text-xs font-semibold text-[#1A1D26] dark:text-slate-200">Simulate Network Latency</div>
                  <div className="text-[11px] text-[#7D8592] dark:text-[#888888]">Introduces an asynchronous delay to actions</div>
                </div>
                <Switch
                  checked={settings.simulateNetworkDelay}
                  onCheckedChange={(val) => dispatch(setSimulateNetworkDelay(val))}
                />
              </div>

              {settings.simulateNetworkDelay && (
                <div>
                  <label className="text-xs font-medium text-[#1A1D26] dark:text-slate-300">
                    Latency Delay: {settings.delayMs}ms
                  </label>
                  <input
                    type="range"
                    min={100}
                    max={2000}
                    step={50}
                    value={settings.delayMs}
                    onChange={(e) => dispatch(setDelayMs(Number(e.target.value)))}
                    className="w-full mt-2 accent-[#5D5FEF]"
                  />
                </div>
              )}

              <div className="pt-2 border-t border-[#F0F1F5] dark:border-[#222222]">
                <div className="text-xs font-semibold text-[#1A1D26] dark:text-slate-300 mb-2">Test Optimistic Rollback</div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    toast.promise(
                      new Promise((_, reject) => setTimeout(() => reject(new Error('Simulated network timeout')), 1000)),
                      {
                        loading: 'Performing optimistic action...',
                        success: 'Success',
                        error: 'Simulated failure triggered! State rolled back automatically.',
                      }
                    );
                  }}
                  className="text-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Trigger Simulated Rollback
                </Button>
              </div>
            </TabsContent>

            {/* 4. Backup & Migration Tab */}
            <TabsContent value="backup" className="space-y-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-[#F0F1F5] dark:border-[#222222] bg-[#F6F7FB] dark:bg-[#111111] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center space-x-2 text-xs font-bold text-[#1A1D26] dark:text-white mb-1">
                      <Download className="w-4 h-4 text-[#5D5FEF]" />
                      <span>Export JSON Backup</span>
                    </div>
                    <p className="text-[11px] text-[#7D8592] dark:text-[#888888] leading-relaxed">
                      Downloads an all-inclusive JSON snapshot of all workspaces, projects, tasks, subtasks, and comments.
                    </p>
                  </div>
                  <Button className="mt-4 w-full bg-[#5D5FEF] hover:bg-[#4E50E6] text-white text-xs" onClick={handleExportData}>
                    Export All Data
                  </Button>
                </div>

                <div className="p-4 rounded-xl border border-[#F0F1F5] dark:border-[#222222] bg-[#F6F7FB] dark:bg-[#111111] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center space-x-2 text-xs font-bold text-[#1A1D26] dark:text-white mb-1">
                      <Upload className="w-4 h-4 text-[#00D2B4]" />
                      <span>Import JSON Backup</span>
                    </div>
                    <p className="text-[11px] text-[#7D8592] dark:text-[#888888] leading-relaxed">
                      Restore application state from a previously exported backup file. Validates schemas automatically.
                    </p>
                  </div>
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      className="hidden"
                      onChange={handleImportFile}
                    />
                    <Button
                      variant="outline"
                      className="mt-4 w-full text-xs border-[#F0F1F5] dark:border-[#222222]"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Select JSON File
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* 5. Danger Zone Tab */}
            <TabsContent value="danger" className="space-y-4 py-4">
              <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/5">
                <div className="flex items-center space-x-2 text-rose-500 font-semibold text-xs mb-1">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Reset All Application Data</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                  This will wipe out all changes from browser localStorage and restore clean initial state with sample workspaces, projects, and tasks. This action cannot be undone.
                </p>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="text-xs">
                      Reset All Data
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will reset your entire local database. All custom tasks, workspaces, and projects will be cleared and replaced with standard initial data.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleResetData} className="bg-rose-600 hover:bg-rose-700 text-white">
                        Yes, Reset Everything
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
