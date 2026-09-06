import { UserRole } from '@/types/auth';
import { Workspace } from '@/types/workspace';
import { Project } from '@/types/project';
import { Task } from '@/types/task';

export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
}

export const PERMISSIONS = {
  // Workspace
  CREATE_WORKSPACE: ['Owner', 'Admin', 'Member'] as UserRole[],
  MANAGE_WORKSPACE: ['Owner', 'Admin', 'Member'] as UserRole[],
  DELETE_WORKSPACE: ['Owner', 'Admin', 'Member'] as UserRole[],
  INVITE_MEMBERS: ['Owner', 'Admin', 'Member'] as UserRole[],
  REMOVE_MEMBERS: ['Owner', 'Admin', 'Member'] as UserRole[],

  // Projects
  CREATE_PROJECT: ['Owner', 'Admin', 'Member'] as UserRole[],
  EDIT_PROJECT: ['Owner', 'Admin', 'Member'] as UserRole[],
  DELETE_PROJECT: ['Owner', 'Admin', 'Member'] as UserRole[],
  ARCHIVE_PROJECT: ['Owner', 'Admin', 'Member'] as UserRole[],

  // Tasks
  CREATE_TASK: ['Owner', 'Admin', 'Member'] as UserRole[],
  EDIT_TASK: ['Owner', 'Admin', 'Member'] as UserRole[],
  MOVE_TASK: ['Owner', 'Admin', 'Member'] as UserRole[],
  DELETE_TASK: ['Owner', 'Admin', 'Member'] as UserRole[],
  BULK_OPERATIONS: ['Owner', 'Admin', 'Member'] as UserRole[],

  // Subtasks & Comments
  MANAGE_SUBTASKS: ['Owner', 'Admin', 'Member'] as UserRole[],
  ADD_COMMENT: ['Owner', 'Admin', 'Member'] as UserRole[],
  DELETE_COMMENT: ['Owner', 'Admin'] as UserRole[],

  // Settings & Danger Zone
  ACCESS_DANGER_ZONE: ['Owner', 'Member'] as UserRole[],
  EXPORT_DATA: ['Owner', 'Admin', 'Member', 'Viewer'] as UserRole[],
  IMPORT_DATA: ['Owner', 'Admin'] as UserRole[],
};

export function checkPermission(
  userRole: UserRole | undefined,
  allowedRoles: UserRole[],
  actionName: string
): PermissionCheckResult {
  if (!userRole) {
    return { allowed: false, reason: 'Authentication required' };
  }

  if (allowedRoles.includes(userRole)) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: `Access Denied: ${userRole}s cannot ${actionName}.`,
  };
}

export function canCreateTask(role?: UserRole): boolean {
  return !!role && PERMISSIONS.CREATE_TASK.includes(role);
}

export function canEditTask(role?: UserRole, task?: Task, userId?: string): boolean {
  if (!role || role === 'Viewer') return false;
  if (role === 'Owner' || role === 'Admin') return true;
  if (role === 'Member') {
    if (!task || !userId) return true;
    return task.reporterId === userId;
  }
  return false;
}

export function canDeleteTask(role?: UserRole, task?: Task, userId?: string): boolean {
  if (!role || role === 'Viewer') return false;
  if (role === 'Owner' || role === 'Admin') return true;
  if (role === 'Member') {
    if (!task || !userId) return true;
    return task.reporterId === userId;
  }
  return false;
}

export function canCreateWorkspace(role?: UserRole): boolean {
  return !!role && (role === 'Owner' || role === 'Admin' || role === 'Member');
}

export function canManageWorkspace(role?: UserRole, workspace?: Workspace, userId?: string): boolean {
  if (!role || role === 'Viewer') return false;
  if (role === 'Owner' || role === 'Admin') return true;
  if (role === 'Member') {
    if (!workspace || !userId) return true;
    return workspace.ownerId === userId;
  }
  return false;
}

export function canEditWorkspace(role?: UserRole, workspace?: Workspace, userId?: string): boolean {
  if (!role || role === 'Viewer') return false;
  if (role === 'Owner' || role === 'Admin') return true;
  if (role === 'Member') {
    if (!workspace || !userId) return true;
    return workspace.ownerId === userId;
  }
  return false;
}

export function canDeleteWorkspace(role?: UserRole, workspace?: Workspace, userId?: string): boolean {
  if (!role || role === 'Viewer') return false;
  if (role === 'Owner') return true;
  if (workspace && userId && workspace.ownerId === userId) return true;
  return false;
}

export function canInviteMembers(role?: UserRole, workspace?: Workspace, userId?: string): boolean {
  if (!role || role === 'Viewer') return false;
  if (role === 'Owner' || role === 'Admin') return true;
  if (role === 'Member') {
    if (!workspace || !userId) return true;
    return workspace.ownerId === userId || workspace.members.some((m) => m.userId === userId);
  }
  return false;
}

export function canCreateProject(role?: UserRole, workspace?: Workspace, userId?: string): boolean {
  if (!role || role === 'Viewer') return false;
  if (role === 'Owner' || role === 'Admin') return true;
  if (role === 'Member') {
    if (!workspace || !userId) return true;
    return workspace.ownerId === userId || workspace.members.some((m) => m.userId === userId);
  }
  return false;
}

export function canManageProjects(role?: UserRole, workspace?: Workspace, userId?: string): boolean {
  return canCreateProject(role, workspace, userId);
}

export function canEditProject(role?: UserRole, project?: Project, userId?: string, workspace?: Workspace): boolean {
  if (!role || role === 'Viewer') return false;
  if (role === 'Owner' || role === 'Admin') return true;
  if (role === 'Member') {
    if (workspace && userId && workspace.ownerId === userId) return true;
    if (project && userId) {
      if (project.members.some((m) => m.userId === userId)) return true;
    }
    return true;
  }
  return false;
}

export function canDeleteProject(role?: UserRole, project?: Project, userId?: string, workspace?: Workspace): boolean {
  if (!role || role === 'Viewer') return false;
  if (role === 'Owner' || role === 'Admin') return true;
  if (role === 'Member') {
    if (workspace && userId && workspace.ownerId === userId) return true;
    if (project && userId) {
      if (project.members.some((m) => m.userId === userId && m.role === 'lead')) return true;
    }
    return true;
  }
  return false;
}

export function canAccessDangerZone(role?: UserRole, workspace?: Workspace, userId?: string): boolean {
  if (!role || role === 'Viewer') return false;
  if (role === 'Owner') return true;
  if (workspace && userId && workspace.ownerId === userId) return true;
  return false;
}

export function canManageSettings(role?: UserRole, workspace?: Workspace, userId?: string): boolean {
  if (!role || role === 'Viewer') return false;
  if (role === 'Owner' || role === 'Admin') return true;
  if (role === 'Member') {
    if (!workspace || !userId) return true;
    return workspace.ownerId === userId;
  }
  return false;
}

export function canViewDashboard(role?: UserRole): boolean {
  return !!role && (role === 'Owner' || role === 'Admin');
}
