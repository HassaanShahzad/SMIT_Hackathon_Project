import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Workspace, WorkspaceFormValues, WorkspaceMember } from '@/types/workspace';
import { UserRole } from '@/types/auth';
import { STORAGE_KEYS } from '@/lib/storageKeys';
import { getData, setData, INITIAL_WORKSPACES } from '@/lib/storage';

interface WorkspaceState {
  workspaces: Workspace[];
  activeWorkspaceId: string;
}

const initialState: WorkspaceState = {
  workspaces: INITIAL_WORKSPACES,
  activeWorkspaceId: INITIAL_WORKSPACES[0]?.id || '',
};

export const workspaceSlice = createSlice({
  name: 'workspace',
  initialState,
  reducers: {
    hydrateWorkspaces: (state) => {
      const stored = getData<Workspace[]>(STORAGE_KEYS.WORKSPACES, INITIAL_WORKSPACES);
      state.workspaces = stored;
      if (!state.workspaces.some((w) => w.id === state.activeWorkspaceId)) {
        state.activeWorkspaceId = state.workspaces[0]?.id || '';
      }
    },
    setActiveWorkspace: (state, action: PayloadAction<string>) => {
      if (state.workspaces.some((w) => w.id === action.payload)) {
        state.activeWorkspaceId = action.payload;
      }
    },
    createWorkspace: (
      state,
      action: PayloadAction<WorkspaceFormValues & { ownerId: string }>
    ) => {
      const newWs: Workspace = {
        id: `ws_${Date.now()}`,
        name: action.payload.name,
        slug: action.payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: action.payload.description || '',
        icon: action.payload.icon || 'Layers',
        color: action.payload.color || 'indigo',
        ownerId: action.payload.ownerId,
        members: [
          {
            userId: action.payload.ownerId,
            role: 'Owner',
            joinedAt: new Date().toISOString(),
          },
        ],
        settings: {
          defaultView: action.payload.defaultView || 'kanban',
          allowGuestInvites: true,
          notifyOnTaskAssignment: true,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      state.workspaces.push(newWs);
      state.activeWorkspaceId = newWs.id;
      setData(STORAGE_KEYS.WORKSPACES, state.workspaces);
    },
    updateWorkspace: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<Workspace> }>
    ) => {
      const index = state.workspaces.findIndex((w) => w.id === action.payload.id);
      if (index !== -1) {
        state.workspaces[index] = {
          ...state.workspaces[index],
          ...action.payload.updates,
          updatedAt: new Date().toISOString(),
        };
        setData(STORAGE_KEYS.WORKSPACES, state.workspaces);
      }
    },
    deleteWorkspace: (state, action: PayloadAction<string>) => {
      if (state.workspaces.length <= 1) return; // Prevent deleting last workspace
      state.workspaces = state.workspaces.filter((w) => w.id !== action.payload);
      if (state.activeWorkspaceId === action.payload) {
        state.activeWorkspaceId = state.workspaces[0]?.id || '';
      }
      setData(STORAGE_KEYS.WORKSPACES, state.workspaces);
    },
    inviteMember: (
      state,
      action: PayloadAction<{ workspaceId: string; userId: string; role: UserRole }>
    ) => {
      const ws = state.workspaces.find((w) => w.id === action.payload.workspaceId);
      if (ws) {
        const exists = ws.members.some((m) => m.userId === action.payload.userId);
        if (!exists) {
          ws.members.push({
            userId: action.payload.userId,
            role: action.payload.role,
            joinedAt: new Date().toISOString(),
          });
          setData(STORAGE_KEYS.WORKSPACES, state.workspaces);
        }
      }
    },
    removeMember: (
      state,
      action: PayloadAction<{ workspaceId: string; userId: string }>
    ) => {
      const ws = state.workspaces.find((w) => w.id === action.payload.workspaceId);
      if (ws && ws.ownerId !== action.payload.userId) {
        ws.members = ws.members.filter((m) => m.userId !== action.payload.userId);
        setData(STORAGE_KEYS.WORKSPACES, state.workspaces);
      }
    },
    updateMemberRole: (
      state,
      action: PayloadAction<{ workspaceId: string; userId: string; role: UserRole }>
    ) => {
      const ws = state.workspaces.find((w) => w.id === action.payload.workspaceId);
      if (ws && ws.ownerId !== action.payload.userId) {
        const member = ws.members.find((m) => m.userId === action.payload.userId);
        if (member) {
          member.role = action.payload.role;
          setData(STORAGE_KEYS.WORKSPACES, state.workspaces);
        }
      }
    },
  },
});

export const {
  hydrateWorkspaces,
  setActiveWorkspace,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
  inviteMember,
  removeMember,
  updateMemberRole,
} = workspaceSlice.actions;

export default workspaceSlice.reducer;
