export type TaskStatus = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'DONE';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface TaskAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: string;
}

export interface Subtask {
  id: string;
  taskId: string;
  parentId?: string | null; // For nested hierarchy
  title: string;
  completed: boolean;
  order: number;
  dueDate?: string | null;
  assigneeId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  taskNumber: number; // e.g. SAAS-12
  workspaceId: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string | null;
  reporterId: string;
  dueDate: string | null; // ISO string
  labels: string[];
  attachments: TaskAttachment[];
  order: number; // for reordering within column
  createdAt: string;
  updatedAt: string;
}

export interface TaskFormValues {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: string;
  assigneeId?: string;
  dueDate?: string;
  labels: string[];
}

export interface SubtaskFormValues {
  title: string;
  parentId?: string | null;
}
