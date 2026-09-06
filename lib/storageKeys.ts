export const STORAGE_KEYS = {
  USERS: 'workspace_manager_users',
  SESSION: 'workspace_manager_session',
  WORKSPACES: 'workspace_manager_workspaces',
  WORKSPACE_MEMBERS: 'workspace_manager_workspace_members',
  PROJECTS: 'workspace_manager_projects',
  PROJECT_MEMBERS: 'workspace_manager_project_members',
  TASKS: 'workspace_manager_tasks',
  SUBTASKS: 'workspace_manager_subtasks',
  COMMENTS: 'workspace_manager_comments',
  NOTIFICATIONS: 'workspace_manager_notifications',
  ACTIVITIES: 'workspace_manager_activities',
  SETTINGS: 'workspace_manager_settings',
  FILTERS: 'workspace_manager_filters',
  PREFERENCES: 'workspace_manager_preferences',
} as const;

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];
