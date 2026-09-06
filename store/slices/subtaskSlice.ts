import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Subtask } from '@/types/task';
import { STORAGE_KEYS } from '@/lib/storageKeys';
import { getData, setData, INITIAL_SUBTASKS } from '@/lib/storage';

interface SubtaskState {
  subtasks: Subtask[];
}

const initialState: SubtaskState = {
  subtasks: INITIAL_SUBTASKS,
};

export const subtaskSlice = createSlice({
  name: 'subtask',
  initialState,
  reducers: {
    hydrateSubtasks: (state) => {
      state.subtasks = getData<Subtask[]>(STORAGE_KEYS.SUBTASKS, INITIAL_SUBTASKS);
    },
    createSubtask: (
      state,
      action: PayloadAction<{
        taskId: string;
        title: string;
        parentId?: string | null;
        assigneeId?: string | null;
        dueDate?: string | null;
      }>
    ) => {
      const taskSubtasks = state.subtasks.filter((s) => s.taskId === action.payload.taskId);
      const newSubtask: Subtask = {
        id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        taskId: action.payload.taskId,
        parentId: action.payload.parentId || null,
        title: action.payload.title,
        completed: false,
        order: taskSubtasks.length,
        assigneeId: action.payload.assigneeId || null,
        dueDate: action.payload.dueDate || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      state.subtasks.push(newSubtask);
      setData(STORAGE_KEYS.SUBTASKS, state.subtasks);
    },
    toggleSubtask: (state, action: PayloadAction<string>) => {
      const subtask = state.subtasks.find((s) => s.id === action.payload);
      if (subtask) {
        subtask.completed = !subtask.completed;
        subtask.updatedAt = new Date().toISOString();

        // If completing a parent subtask, complete all its children
        if (subtask.completed) {
          state.subtasks.forEach((s) => {
            if (s.parentId === subtask.id) {
              s.completed = true;
              s.updatedAt = new Date().toISOString();
            }
          });
        }
        setData(STORAGE_KEYS.SUBTASKS, state.subtasks);
      }
    },
    updateSubtask: (
      state,
      action: PayloadAction<{ id: string; title: string }>
    ) => {
      const subtask = state.subtasks.find((s) => s.id === action.payload.id);
      if (subtask) {
        subtask.title = action.payload.title;
        subtask.updatedAt = new Date().toISOString();
        setData(STORAGE_KEYS.SUBTASKS, state.subtasks);
      }
    },
    deleteSubtask: (state, action: PayloadAction<string>) => {
      const idToDelete = action.payload;
      // Recursively gather all children to delete
      const idsToDelete = new Set<string>([idToDelete]);
      let changed = true;
      while (changed) {
        changed = false;
        state.subtasks.forEach((s) => {
          if (s.parentId && idsToDelete.has(s.parentId) && !idsToDelete.has(s.id)) {
            idsToDelete.add(s.id);
            changed = true;
          }
        });
      }

      state.subtasks = state.subtasks.filter((s) => !idsToDelete.has(s.id));
      setData(STORAGE_KEYS.SUBTASKS, state.subtasks);
    },
    reorderSubtasks: (
      state,
      action: PayloadAction<{ taskId: string; orderedIds: string[] }>
    ) => {
      action.payload.orderedIds.forEach((id, index) => {
        const sub = state.subtasks.find((s) => s.id === id);
        if (sub) sub.order = index;
      });
      setData(STORAGE_KEYS.SUBTASKS, state.subtasks);
    },
    convertTaskToSubtask: (
      state,
      action: PayloadAction<{
        parentTaskId: string;
        subtaskTitle: string;
      }>
    ) => {
      const newSubtask: Subtask = {
        id: `sub_${Date.now()}`,
        taskId: action.payload.parentTaskId,
        parentId: null,
        title: action.payload.subtaskTitle,
        completed: false,
        order: state.subtasks.filter((s) => s.taskId === action.payload.parentTaskId).length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      state.subtasks.push(newSubtask);
      setData(STORAGE_KEYS.SUBTASKS, state.subtasks);
    },
  },
});

export const {
  hydrateSubtasks,
  createSubtask,
  toggleSubtask,
  updateSubtask,
  deleteSubtask,
  reorderSubtasks,
  convertTaskToSubtask,
} = subtaskSlice.actions;

export default subtaskSlice.reducer;
