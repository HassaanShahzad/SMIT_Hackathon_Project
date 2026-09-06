export type NotificationType =
  | 'task_assigned'
  | 'mention'
  | 'due_date'
  | 'status_change'
  | 'project_update';

export interface Notification {
  id: string;
  recipientId: string;
  senderId: string;
  type: NotificationType;
  title: string;
  message: string;
  taskId?: string;
  projectId?: string;
  read: boolean;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  workspaceId: string;
  projectId?: string;
  taskId?: string;
  userId: string;
  action: string; // e.g. "created task", "changed status to DONE", "assigned to @Alex"
  details?: string;
  timestamp: string;
}

export interface NotificationPreferences {
  taskAssigned: boolean;
  mentions: boolean;
  dueDateReminders: boolean;
  statusChanges: boolean;
}
