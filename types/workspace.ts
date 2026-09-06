import { UserRole } from './auth';

export type WorkspaceColor = 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky' | 'purple';

export interface WorkspaceMember {
  userId: string;
  role: UserRole;
  joinedAt: string;
}

export interface WorkspaceSettings {
  defaultView: 'kanban' | 'list' | 'calendar';
  allowGuestInvites: boolean;
  notifyOnTaskAssignment: boolean;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon: string;
  color: WorkspaceColor;
  ownerId: string;
  members: WorkspaceMember[];
  settings: WorkspaceSettings;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceFormValues {
  name: string;
  description?: string;
  icon: string;
  color: WorkspaceColor;
  defaultView: 'kanban' | 'list' | 'calendar';
}
