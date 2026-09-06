import { TaskStatus } from './task';

export type ProjectColor = 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky' | 'purple' | 'cyan' | 'pink';

export type ProjectStatus = 'active' | 'archived' | 'completed';

export type ProjectTemplate = 'custom' | 'saas_launch' | 'sprint_tracker' | 'bug_triage' | 'marketing';

export interface ProjectMember {
  userId: string;
  role: 'lead' | 'contributor' | 'viewer';
}

export interface KanbanColumnConfig {
  id: string;
  title: string;
  status: TaskStatus;
  color?: string;
  order: number;
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  key: string; // e.g. "PRJ", "SAAS"
  description: string;
  icon: string;
  color: ProjectColor;
  status: ProjectStatus;
  template?: ProjectTemplate;
  members: ProjectMember[];
  customColumns?: KanbanColumnConfig[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectFormValues {
  name: string;
  key: string;
  description: string;
  icon: string;
  color: ProjectColor;
  template: ProjectTemplate;
}
