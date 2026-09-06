import { STORAGE_KEYS } from './storageKeys';
import { User } from '@/types/auth';
import { Workspace } from '@/types/workspace';
import { Project } from '@/types/project';
import { Task, Subtask } from '@/types/task';
import { Comment } from '@/types/comment';
import { Notification, ActivityLog } from '@/types/notification';

const isBrowser = typeof window !== 'undefined';

export function getData<T>(key: string, defaultValue: T): T {
  if (!isBrowser) return defaultValue;
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    return JSON.parse(item) as T;
  } catch (error) {
    console.error(`Error reading key "${key}" from localStorage:`, error);
    return defaultValue;
  }
}

export function setData<T>(key: string, value: T): void {
  if (!isBrowser) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing key "${key}" to localStorage:`, error);
  }
}

export function removeData(key: string): void {
  if (!isBrowser) return;
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing key "${key}" from localStorage:`, error);
  }
}

export function clearData(): void {
  if (!isBrowser) return;
  try {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.error('Error clearing localStorage:', error);
  }
}

export function updateData<T>(key: string, updater: (prev: T) => T, defaultValue: T): T {
  const current = getData<T>(key, defaultValue);
  const updated = updater(current);
  setData(key, updated);
  return updated;
}

// Section 7: Required Mock Users & Roles
export const INITIAL_USERS: User[] = [
  {
    id: 'user_hassaan',
    name: 'Hassaan Shahzad',
    email: process.env.NEXT_PUBLIC_OWNER_EMAIL || 'hassaan@acme.com',
    password: process.env.NEXT_PUBLIC_OWNER_PASSWORD || 'Owner@123',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    role: 'Owner',
    department: 'Leadership & Architecture',
    createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
  },
  {
    id: 'user_sara',
    name: 'Sara',
    email: process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'sara@acme.com',
    password: process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'Admin@123',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    role: 'Admin',
    department: 'Engineering & Orchestration',
    createdAt: new Date(Date.now() - 80 * 86400000).toISOString(),
  },
  {
    id: 'user_ali',
    name: 'Ali',
    email: 'ali@acme.com',
    password: 'Member@123',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    role: 'Member',
    department: 'Task Collaboration & Execution',
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
  {
    id: 'user_farhan',
    name: 'Farhan',
    email: 'farhan@acme.com',
    password: 'Viewer@123',
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
    role: 'Viewer',
    department: 'Quality Observation',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
];

export const INITIAL_WORKSPACES: Workspace[] = [
  {
    id: 'ws_acme',
    name: 'Hackathone Workspace',
    slug: 'hackathone-workspace',
    description: 'A dedicated workspace for managing hackathon projects, team collaboration, tasks, ideas, deadlines, and development activities in one organized place.',
    icon: 'Layers',
    color: 'indigo',
    ownerId: 'user_hassaan',
    members: [
      { userId: 'user_hassaan', role: 'Owner', joinedAt: new Date(Date.now() - 90 * 86400000).toISOString() },
      { userId: 'user_sara', role: 'Admin', joinedAt: new Date(Date.now() - 80 * 86400000).toISOString() },
      { userId: 'user_ali', role: 'Member', joinedAt: new Date(Date.now() - 60 * 86400000).toISOString() },
      { userId: 'user_farhan', role: 'Viewer', joinedAt: new Date(Date.now() - 30 * 86400000).toISOString() },
    ],
    settings: {
      defaultView: 'kanban',
      allowGuestInvites: true,
      notifyOnTaskAssignment: true,
    },
    createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ws_design',
    name: 'Ecommerce Website Workspace',
    slug: 'ecommerce-website-workspace',
    description: 'A dedicated workspace for planning and developing an e-commerce website, including products, features, UI improvements, development tasks, and project management.',
    icon: 'Palette',
    color: 'emerald',
    ownerId: 'user_hassaan',
    members: [
      { userId: 'user_hassaan', role: 'Owner', joinedAt: new Date(Date.now() - 50 * 86400000).toISOString() },
      { userId: 'user_sara', role: 'Admin', joinedAt: new Date(Date.now() - 40 * 86400000).toISOString() },
      { userId: 'user_ali', role: 'Member', joinedAt: new Date(Date.now() - 30 * 86400000).toISOString() },
    ],
    settings: {
      defaultView: 'list',
      allowGuestInvites: false,
      notifyOnTaskAssignment: true,
    },
    createdAt: new Date(Date.now() - 50 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj_core',
    workspaceId: 'ws_acme',
    name: 'SMIT Hackathone',
    key: 'SMIT',
    description: 'A collaborative hackathon project focused on building innovative solutions, rapid development, teamwork, and presenting a complete working product within a limited timeframe.',
    icon: 'Boxes',
    color: 'indigo',
    status: 'active',
    template: 'saas_launch',
    members: [
      { userId: 'user_hassaan', role: 'lead' },
      { userId: 'user_sara', role: 'contributor' },
      { userId: 'user_ali', role: 'contributor' },
    ],
    customColumns: [
      { id: 'col_backlog', title: 'Backlog', status: 'BACKLOG', order: 0 },
      { id: 'col_todo', title: 'To Do', status: 'TODO', order: 1 },
      { id: 'col_progress', title: 'In Progress', status: 'IN_PROGRESS', order: 2 },
      { id: 'col_done', title: 'Done', status: 'DONE', order: 3 },
    ],
    createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'proj_mobile',
    workspaceId: 'ws_acme',
    name: 'E-commerce Project',
    key: 'ECM',
    description: 'A modern e-commerce platform focused on product discovery, shopping experiences, cart management, checkout, and creating a smooth online buying journey.',
    icon: 'Smartphone',
    color: 'purple',
    status: 'active',
    template: 'sprint_tracker',
    members: [
      { userId: 'user_sara', role: 'lead' },
      { userId: 'user_ali', role: 'contributor' },
    ],
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'proj_quality',
    workspaceId: 'ws_acme',
    name: 'PUBG Gaming Project',
    key: 'PUBG',
    description: 'A gaming-focused project built around PUBG-style experiences, gameplay features, performance optimization, competitive interactions, and an engaging user experience.',
    icon: 'ShieldCheck',
    color: 'rose',
    status: 'active',
    template: 'bug_triage',
    members: [
      { userId: 'user_ali', role: 'lead' },
      { userId: 'user_farhan', role: 'viewer' },
    ],
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'proj_design_kit',
    workspaceId: 'ws_design',
    name: 'Unified Design Token Library',
    key: 'DSK',
    description: 'Multi-brand CSS variables, glassmorphism tokens, and accessible contrast palettes',
    icon: 'Figma',
    color: 'emerald',
    status: 'active',
    template: 'custom',
    members: [
      { userId: 'user_hassaan', role: 'lead' },
      { userId: 'user_ali', role: 'contributor' },
    ],
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const INITIAL_TASKS: Task[] = [];

// Section 17: Support nested subtasks
export const INITIAL_SUBTASKS: Subtask[] = [];

export const INITIAL_COMMENTS: Comment[] = [];

export const INITIAL_NOTIFICATIONS: Notification[] = [];

export const INITIAL_ACTIVITIES: ActivityLog[] = [];

export function seedInitialDataIfEmpty(): void {
  if (!isBrowser) return;

  // Always sync initial users with modern credentials
  const existingUsers = getData<User[]>(STORAGE_KEYS.USERS, []);
  if (existingUsers.length === 0 || !existingUsers.some(u => u.name.includes('Hassaan'))) {
    setData(STORAGE_KEYS.USERS, INITIAL_USERS);
  }

  if (!localStorage.getItem(STORAGE_KEYS.WORKSPACES)) {
    setData(STORAGE_KEYS.WORKSPACES, INITIAL_WORKSPACES);
  } else {
    // Migrate old workspace names if present
    const workspaces = getData<Workspace[]>(STORAGE_KEYS.WORKSPACES, []);
    let modified = false;
    const updatedWorkspaces = workspaces.map((ws) => {
      if (ws.id === 'ws_acme' && (ws.name === 'Acme Global Platform' || !ws.name)) {
        modified = true;
        return {
          ...ws,
          name: 'Hackathone Workspace',
          description: 'A dedicated workspace for managing hackathon projects, team collaboration, tasks, ideas, deadlines, and development activities in one organized place.',
        };
      }
      if (ws.id === 'ws_design' && (ws.name === 'NextGen Design Studio' || !ws.name)) {
        modified = true;
        return {
          ...ws,
          name: 'Ecommerce Website Workspace',
          description: 'A dedicated workspace for planning and developing an e-commerce website, including products, features, UI improvements, development tasks, and project management.',
        };
      }
      return ws;
    });
    if (modified) {
      setData(STORAGE_KEYS.WORKSPACES, updatedWorkspaces);
    }
  }

  if (!localStorage.getItem(STORAGE_KEYS.PROJECTS)) {
    setData(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
  } else {
    // Migrate old project names if present
    const projects = getData<Project[]>(STORAGE_KEYS.PROJECTS, []);
    let modified = false;
    const updatedProjects = projects.map((p) => {
      if (p.id === 'proj_core' && p.name === 'Platform 2.0 Architecture') {
        modified = true;
        return {
          ...p,
          name: 'SMIT Hackathone',
          description: 'A collaborative hackathon project focused on building innovative solutions, rapid development, teamwork, and presenting a complete working product within a limited timeframe.',
        };
      }
      if (p.id === 'proj_mobile' && p.name === 'iOS & Android Experience') {
        modified = true;
        return {
          ...p,
          name: 'E-commerce Project',
          description: 'A modern e-commerce platform focused on product discovery, shopping experiences, cart management, checkout, and creating a smooth online buying journey.',
        };
      }
      if (p.id === 'proj_quality' && p.name === 'Performance & QA Audit') {
        modified = true;
        return {
          ...p,
          name: 'PUBG Gaming Project',
          description: 'A gaming-focused project built around PUBG-style experiences, gameplay features, performance optimization, competitive interactions, and an engaging user experience.',
        };
      }
      return p;
    });
    if (modified) {
      setData(STORAGE_KEYS.PROJECTS, updatedProjects);
    }
  }

  if (!localStorage.getItem(STORAGE_KEYS.TASKS)) {
    setData(STORAGE_KEYS.TASKS, INITIAL_TASKS);
  } else {
    // Remove old seeded demo tasks if present (task_1 to task_6)
    const existingTasks = getData<Task[]>(STORAGE_KEYS.TASKS, []);
    const demoTaskIds = new Set(['task_1', 'task_2', 'task_3', 'task_4', 'task_5', 'task_6']);
    const filteredTasks = existingTasks.filter((t) => !demoTaskIds.has(t.id));
    if (filteredTasks.length !== existingTasks.length) {
      setData(STORAGE_KEYS.TASKS, filteredTasks);
    }
  }
  if (!localStorage.getItem(STORAGE_KEYS.SUBTASKS)) {
    setData(STORAGE_KEYS.SUBTASKS, INITIAL_SUBTASKS);
  } else {
    // Remove old demo subtasks
    const existingSubtasks = getData<Subtask[]>(STORAGE_KEYS.SUBTASKS, []);
    const demoSubtaskIds = new Set(['sub_1', 'sub_1_child_1', 'sub_2', 'sub_3', 'sub_4', 'sub_5']);
    const demoTaskIds = new Set(['task_1', 'task_2', 'task_3', 'task_4', 'task_5', 'task_6']);
    const filteredSubtasks = existingSubtasks.filter(
      (s) => !demoSubtaskIds.has(s.id) && !demoTaskIds.has(s.taskId)
    );
    if (filteredSubtasks.length !== existingSubtasks.length) {
      setData(STORAGE_KEYS.SUBTASKS, filteredSubtasks);
    }
  }
  if (!localStorage.getItem(STORAGE_KEYS.COMMENTS)) {
    setData(STORAGE_KEYS.COMMENTS, INITIAL_COMMENTS);
  } else {
    const existingComments = getData<Comment[]>(STORAGE_KEYS.COMMENTS, []);
    const demoCommentIds = new Set(['comm_1', 'comm_2']);
    const demoTaskIds = new Set(['task_1', 'task_2', 'task_3', 'task_4', 'task_5', 'task_6']);
    const filteredComments = existingComments.filter(
      (c) => !demoCommentIds.has(c.id) && !demoTaskIds.has(c.taskId)
    );
    if (filteredComments.length !== existingComments.length) {
      setData(STORAGE_KEYS.COMMENTS, filteredComments);
    }
  }
  if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
    setData(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  } else {
    const existingNotifications = getData<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    const demoNotifIds = new Set(['notif_1', 'notif_2']);
    const filteredNotifications = existingNotifications.filter((n) => !demoNotifIds.has(n.id));
    if (filteredNotifications.length !== existingNotifications.length) {
      setData(STORAGE_KEYS.NOTIFICATIONS, filteredNotifications);
    }
  }
  if (!localStorage.getItem(STORAGE_KEYS.ACTIVITIES)) {
    setData(STORAGE_KEYS.ACTIVITIES, INITIAL_ACTIVITIES);
  } else {
    // Remove old dummy activities if present
    const existingActivities = getData<ActivityLog[]>(STORAGE_KEYS.ACTIVITIES, []);
    const filtered = existingActivities.filter(
      (a) => a.id !== 'act_1' && a.id !== 'act_2' && a.id !== 'act_3'
    );
    if (filtered.length !== existingActivities.length) {
      setData(STORAGE_KEYS.ACTIVITIES, filtered);
    }
  }
  if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
    setData(STORAGE_KEYS.SETTINGS, {
      theme: 'light', // Section 21: Light Theme is default
      compactMode: false,
      simulateNetworkDelay: false,
      delayMs: 300,
      simulateFailureRate: 0,
      notificationPreferences: {
        taskAssigned: true,
        mentions: true,
        dueDateReminders: true,
        statusChanges: true,
      },
    });
  }
  if (!localStorage.getItem(STORAGE_KEYS.FILTERS)) {
    setData(STORAGE_KEYS.FILTERS, [
      {
        id: 'preset_urgent',
        name: '🔥 Urgent Tasks',
        priority: 'URGENT',
      },
      {
        id: 'preset_in_prog',
        name: '⚡ In Progress',
        status: ['IN_PROGRESS'],
      },
    ]);
  }
}

export function exportAllData(): string {
  if (!isBrowser) return '{}';
  const dump: Record<string, unknown> = {
    exportedAt: new Date().toISOString(),
    version: '1.1.0',
  };
  Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
    try {
      const item = localStorage.getItem(key);
      dump[name] = item ? JSON.parse(item) : null;
    } catch {
      dump[name] = null;
    }
  });
  return JSON.stringify(dump, null, 2);
}

export interface ImportResult {
  success: boolean;
  message: string;
  itemCounts?: {
    workspaces?: number;
    projects?: number;
    tasks?: number;
  };
}

export function importAllData(jsonString: string): ImportResult {
  if (!isBrowser) return { success: false, message: 'Browser environment required' };
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || typeof parsed !== 'object') {
      return { success: false, message: 'Invalid JSON file: Root object missing' };
    }

    const keysMap: Record<string, string> = {
      USERS: STORAGE_KEYS.USERS,
      SESSION: STORAGE_KEYS.SESSION,
      WORKSPACES: STORAGE_KEYS.WORKSPACES,
      PROJECTS: STORAGE_KEYS.PROJECTS,
      TASKS: STORAGE_KEYS.TASKS,
      SUBTASKS: STORAGE_KEYS.SUBTASKS,
      COMMENTS: STORAGE_KEYS.COMMENTS,
      NOTIFICATIONS: STORAGE_KEYS.NOTIFICATIONS,
      ACTIVITIES: STORAGE_KEYS.ACTIVITIES,
      SETTINGS: STORAGE_KEYS.SETTINGS,
      FILTERS: STORAGE_KEYS.FILTERS,
    };

    let importedWorkspaces = 0;
    let importedProjects = 0;
    let importedTasks = 0;

    if (parsed.WORKSPACES && Array.isArray(parsed.WORKSPACES)) {
      importedWorkspaces = parsed.WORKSPACES.length;
    }
    if (parsed.PROJECTS && Array.isArray(parsed.PROJECTS)) {
      importedProjects = parsed.PROJECTS.length;
    }
    if (parsed.TASKS && Array.isArray(parsed.TASKS)) {
      importedTasks = parsed.TASKS.length;
    }

    Object.entries(keysMap).forEach(([prop, storageKey]) => {
      if (parsed[prop] !== undefined) {
        localStorage.setItem(storageKey, JSON.stringify(parsed[prop]));
      }
    });

    return {
      success: true,
      message: `Successfully imported ${importedWorkspaces} workspaces, ${importedProjects} projects, and ${importedTasks} tasks.`,
      itemCounts: {
        workspaces: importedWorkspaces,
        projects: importedProjects,
        tasks: importedTasks,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown JSON parse error';
    return { success: false, message: `Import failed: ${message}` };
  }
}
