import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Project, ProjectFormValues, KanbanColumnConfig } from '@/types/project';
import { TaskStatus } from '@/types/task';
import { STORAGE_KEYS } from '@/lib/storageKeys';
import { getData, setData, INITIAL_PROJECTS } from '@/lib/storage';

interface ProjectState {
  projects: Project[];
  activeProjectId: string | null; // null means 'All Projects'
}

const initialState: ProjectState = {
  projects: INITIAL_PROJECTS,
  activeProjectId: null,
};

export const projectSlice = createSlice({
  name: 'project',
  initialState,
  reducers: {
    hydrateProjects: (state) => {
      state.projects = getData<Project[]>(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
    },
    setActiveProject: (state, action: PayloadAction<string | null>) => {
      state.activeProjectId = action.payload;
    },
    createProject: (
      state,
      action: PayloadAction<ProjectFormValues & { workspaceId: string; creatorId: string }>
    ) => {
      const newProj: Project = {
        id: `proj_${Date.now()}`,
        workspaceId: action.payload.workspaceId,
        name: action.payload.name,
        key: action.payload.key.toUpperCase(),
        description: action.payload.description || '',
        icon: action.payload.icon || 'Folder',
        color: action.payload.color || 'indigo',
        status: 'active',
        template: action.payload.template || 'custom',
        members: [{ userId: action.payload.creatorId, role: 'lead' }],
        customColumns: [
          { id: 'col_backlog', title: 'Backlog', status: 'BACKLOG', order: 0 },
          { id: 'col_todo', title: 'To Do', status: 'TODO', order: 1 },
          { id: 'col_progress', title: 'In Progress', status: 'IN_PROGRESS', order: 2 },
          { id: 'col_done', title: 'Done', status: 'DONE', order: 3 },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      state.projects.push(newProj);
      state.activeProjectId = newProj.id;
      setData(STORAGE_KEYS.PROJECTS, state.projects);
    },
    updateProject: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<Project> }>
    ) => {
      const index = state.projects.findIndex((p) => p.id === action.payload.id);
      if (index !== -1) {
        state.projects[index] = {
          ...state.projects[index],
          ...action.payload.updates,
          updatedAt: new Date().toISOString(),
        };
        setData(STORAGE_KEYS.PROJECTS, state.projects);
      }
    },
    archiveProject: (state, action: PayloadAction<string>) => {
      const proj = state.projects.find((p) => p.id === action.payload);
      if (proj) {
        proj.status = proj.status === 'archived' ? 'active' : 'archived';
        proj.updatedAt = new Date().toISOString();
        setData(STORAGE_KEYS.PROJECTS, state.projects);
      }
    },
    deleteProject: (state, action: PayloadAction<string>) => {
      state.projects = state.projects.filter((p) => p.id !== action.payload);
      if (state.activeProjectId === action.payload) {
        state.activeProjectId = null;
      }
      setData(STORAGE_KEYS.PROJECTS, state.projects);
    },
    // Section 30: Custom Kanban column management
    addProjectColumn: (
      state,
      action: PayloadAction<{
        projectId: string;
        title: string;
        status: TaskStatus;
      }>
    ) => {
      const proj = state.projects.find((p) => p.id === action.payload.projectId);
      if (proj) {
        if (!proj.customColumns) {
          proj.customColumns = [
            { id: 'col_backlog', title: 'Backlog', status: 'BACKLOG', order: 0 },
            { id: 'col_todo', title: 'To Do', status: 'TODO', order: 1 },
            { id: 'col_progress', title: 'In Progress', status: 'IN_PROGRESS', order: 2 },
            { id: 'col_done', title: 'Done', status: 'DONE', order: 3 },
          ];
        }
        const newCol: KanbanColumnConfig = {
          id: `col_${Date.now()}`,
          title: action.payload.title,
          status: action.payload.status,
          order: proj.customColumns.length,
        };
        proj.customColumns.push(newCol);
        setData(STORAGE_KEYS.PROJECTS, state.projects);
      }
    },
    renameProjectColumn: (
      state,
      action: PayloadAction<{
        projectId: string;
        columnId: string;
        newTitle: string;
      }>
    ) => {
      const proj = state.projects.find((p) => p.id === action.payload.projectId);
      if (proj && proj.customColumns) {
        const col = proj.customColumns.find((c) => c.id === action.payload.columnId);
        if (col) {
          col.title = action.payload.newTitle;
          setData(STORAGE_KEYS.PROJECTS, state.projects);
        }
      }
    },
    deleteProjectColumn: (
      state,
      action: PayloadAction<{
        projectId: string;
        columnId: string;
      }>
    ) => {
      const proj = state.projects.find((p) => p.id === action.payload.projectId);
      if (proj && proj.customColumns && proj.customColumns.length > 1) {
        proj.customColumns = proj.customColumns.filter((c) => c.id !== action.payload.columnId);
        setData(STORAGE_KEYS.PROJECTS, state.projects);
      }
    },
  },
});

export const {
  hydrateProjects,
  setActiveProject,
  createProject,
  updateProject,
  archiveProject,
  deleteProject,
  addProjectColumn,
  renameProjectColumn,
  deleteProjectColumn,
} = projectSlice.actions;

export default projectSlice.reducer;
