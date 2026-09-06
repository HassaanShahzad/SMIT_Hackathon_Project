import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type ActiveView = 'dashboard' | 'kanban' | 'list' | 'calendar';

interface UIState {
  activeView: ActiveView;
  commandPaletteOpen: boolean;
  activeTaskId: string | null;
  taskDetailOpen: boolean;
  sidebarCollapsed: boolean;
  mobileNavOpen: boolean;
  isCreateTaskOpen: boolean;
  createTaskDefaultStatus?: 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'DONE';
  isCreateProjectOpen: boolean;
  isCreateWorkspaceOpen: boolean;
  isInviteMemberOpen: boolean;
  isSettingsOpen: boolean;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'signup' | 'profile';
  isSyncing: boolean;
  isOnline: boolean;
  isActive: boolean;
  isConvertTaskModalOpen: boolean;
  convertingTaskId: string | null;
}

const initialState: UIState = {
  activeView: 'dashboard',
  commandPaletteOpen: false,
  activeTaskId: null,
  taskDetailOpen: false,
  sidebarCollapsed: false,
  mobileNavOpen: false,
  isCreateTaskOpen: false,
  createTaskDefaultStatus: undefined,
  isCreateProjectOpen: false,
  isCreateWorkspaceOpen: false,
  isInviteMemberOpen: false,
  isSettingsOpen: false,
  isAuthModalOpen: false,
  authModalMode: 'login',
  isSyncing: false,
  isOnline: true,
  isActive: true,
  isConvertTaskModalOpen: false,
  convertingTaskId: null,
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setActiveView: (state, action: PayloadAction<ActiveView>) => {
      state.activeView = action.payload;
    },
    setCommandPaletteOpen: (state, action: PayloadAction<boolean>) => {
      state.commandPaletteOpen = action.payload;
    },
    openTaskDetail: (state, action: PayloadAction<string>) => {
      state.activeTaskId = action.payload;
      state.taskDetailOpen = true;
    },
    closeTaskDetail: (state) => {
      state.taskDetailOpen = false;
      state.activeTaskId = null;
    },
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
    },
    setMobileNavOpen: (state, action: PayloadAction<boolean>) => {
      state.mobileNavOpen = action.payload;
    },
    setCreateTaskOpen: (
      state,
      action: PayloadAction<{ open: boolean; defaultStatus?: 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'DONE' }>
    ) => {
      state.isCreateTaskOpen = action.payload.open;
      state.createTaskDefaultStatus = action.payload.defaultStatus;
    },
    setCreateProjectOpen: (state, action: PayloadAction<boolean>) => {
      state.isCreateProjectOpen = action.payload;
    },
    setCreateWorkspaceOpen: (state, action: PayloadAction<boolean>) => {
      state.isCreateWorkspaceOpen = action.payload;
    },
    setInviteMemberOpen: (state, action: PayloadAction<boolean>) => {
      state.isInviteMemberOpen = action.payload;
    },
    setSettingsOpen: (state, action: PayloadAction<boolean>) => {
      state.isSettingsOpen = action.payload;
    },
    setAuthModalOpen: (
      state,
      action: PayloadAction<{ open: boolean; mode?: 'login' | 'signup' | 'profile' }>
    ) => {
      state.isAuthModalOpen = action.payload.open;
      if (action.payload.mode) {
        state.authModalMode = action.payload.mode;
      }
    },
    setIsSyncing: (state, action: PayloadAction<boolean>) => {
      state.isSyncing = action.payload;
    },
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
    },
    setActiveStatus: (state, action: PayloadAction<boolean>) => {
      state.isActive = action.payload;
    },
    setConvertTaskModal: (
      state,
      action: PayloadAction<{ open: boolean; taskId?: string | null }>
    ) => {
      state.isConvertTaskModalOpen = action.payload.open;
      state.convertingTaskId = action.payload.taskId || null;
    },
  },
});

export const {
  setActiveView,
  setCommandPaletteOpen,
  openTaskDetail,
  closeTaskDetail,
  toggleSidebar,
  setSidebarCollapsed,
  setMobileNavOpen,
  setCreateTaskOpen,
  setCreateProjectOpen,
  setCreateWorkspaceOpen,
  setInviteMemberOpen,
  setSettingsOpen,
  setAuthModalOpen,
  setIsSyncing,
  setOnlineStatus,
  setActiveStatus,
  setConvertTaskModal,
} = uiSlice.actions;

export default uiSlice.reducer;
