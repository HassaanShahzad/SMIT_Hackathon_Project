import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Task, TaskFormValues, TaskStatus, TaskPriority, TaskAttachment } from '@/types/task';
import { STORAGE_KEYS } from '@/lib/storageKeys';
import { getData, setData, INITIAL_TASKS } from '@/lib/storage';

interface HistorySnapshot {
  description: string;
  tasks: Task[];
  deletedTask?: Task;
}

interface TaskState {
  tasks: Task[];
  undoStack: HistorySnapshot[];
  redoStack: HistorySnapshot[];
  selectedTaskIds: string[];
}

const initialState: TaskState = {
  tasks: INITIAL_TASKS,
  undoStack: [],
  redoStack: [],
  selectedTaskIds: [],
};

export const taskSlice = createSlice({
  name: 'task',
  initialState,
  reducers: {
    hydrateTasks: (state) => {
      state.tasks = getData<Task[]>(STORAGE_KEYS.TASKS, INITIAL_TASKS);
    },
    createTask: (
      state,
      action: PayloadAction<TaskFormValues & { workspaceId: string; reporterId: string }>
    ) => {
      // Save undo snapshot
      state.undoStack.push({
        description: 'Create task',
        tasks: JSON.parse(JSON.stringify(state.tasks)),
      });
      state.redoStack = [];

      const workspaceTasks = state.tasks.filter((t) => t.workspaceId === action.payload.workspaceId);
      const nextNumber = workspaceTasks.length > 0 ? Math.max(...workspaceTasks.map((t) => t.taskNumber)) + 1 : 1;

      const newTask: Task = {
        id: `task_${Date.now()}`,
        taskNumber: nextNumber,
        workspaceId: action.payload.workspaceId,
        projectId: action.payload.projectId,
        title: action.payload.title,
        description: action.payload.description || '',
        status: action.payload.status,
        priority: action.payload.priority,
        assigneeId: action.payload.assigneeId || null,
        reporterId: action.payload.reporterId,
        dueDate: action.payload.dueDate || null,
        labels: action.payload.labels || [],
        attachments: [],
        order: workspaceTasks.filter((t) => t.status === action.payload.status).length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      state.tasks.push(newTask);
      setData(STORAGE_KEYS.TASKS, state.tasks);
    },
    updateTask: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<Task> }>
    ) => {
      const index = state.tasks.findIndex((t) => t.id === action.payload.id);
      if (index !== -1) {
        state.undoStack.push({
          description: `Update task "${state.tasks[index].title}"`,
          tasks: JSON.parse(JSON.stringify(state.tasks)),
        });
        state.redoStack = [];

        state.tasks[index] = {
          ...state.tasks[index],
          ...action.payload.updates,
          updatedAt: new Date().toISOString(),
        };
        setData(STORAGE_KEYS.TASKS, state.tasks);
      }
    },
    moveTaskStatus: (
      state,
      action: PayloadAction<{ id: string; newStatus: TaskStatus; newIndex?: number }>
    ) => {
      const index = state.tasks.findIndex((t) => t.id === action.payload.id);
      if (index !== -1) {
        state.undoStack.push({
          description: `Move status to ${action.payload.newStatus}`,
          tasks: JSON.parse(JSON.stringify(state.tasks)),
        });
        state.redoStack = [];

        state.tasks[index].status = action.payload.newStatus;
        if (typeof action.payload.newIndex === 'number') {
          state.tasks[index].order = action.payload.newIndex;
        }
        state.tasks[index].updatedAt = new Date().toISOString();
        setData(STORAGE_KEYS.TASKS, state.tasks);
      }
    },
    duplicateTask: (state, action: PayloadAction<string>) => {
      const original = state.tasks.find((t) => t.id === action.payload);
      if (original) {
        state.undoStack.push({
          description: `Duplicate task`,
          tasks: JSON.parse(JSON.stringify(state.tasks)),
        });
        state.redoStack = [];

        const workspaceTasks = state.tasks.filter((t) => t.workspaceId === original.workspaceId);
        const nextNumber = Math.max(...workspaceTasks.map((t) => t.taskNumber)) + 1;

        const copy: Task = {
          ...original,
          id: `task_${Date.now()}`,
          taskNumber: nextNumber,
          title: `${original.title} (Copy)`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        state.tasks.push(copy);
        setData(STORAGE_KEYS.TASKS, state.tasks);
      }
    },
    deleteTask: (state, action: PayloadAction<string>) => {
      const deleted = state.tasks.find((t) => t.id === action.payload);
      if (deleted) {
        state.undoStack.push({
          description: `Delete task "${deleted.title}"`,
          tasks: JSON.parse(JSON.stringify(state.tasks)),
          deletedTask: deleted,
        });
        state.redoStack = [];

        state.tasks = state.tasks.filter((t) => t.id !== action.payload);
        state.selectedTaskIds = state.selectedTaskIds.filter((id) => id !== action.payload);
        setData(STORAGE_KEYS.TASKS, state.tasks);
      }
    },
    restoreTask: (state, action: PayloadAction<Task>) => {
      state.tasks.push(action.payload);
      setData(STORAGE_KEYS.TASKS, state.tasks);
    },
    undoLastAction: (state) => {
      const snapshot = state.undoStack.pop();
      if (snapshot) {
        state.redoStack.push({
          description: snapshot.description,
          tasks: JSON.parse(JSON.stringify(state.tasks)),
        });
        state.tasks = snapshot.tasks;
        setData(STORAGE_KEYS.TASKS, state.tasks);
      }
    },
    redoLastAction: (state) => {
      const snapshot = state.redoStack.pop();
      if (snapshot) {
        state.undoStack.push({
          description: snapshot.description,
          tasks: JSON.parse(JSON.stringify(state.tasks)),
        });
        state.tasks = snapshot.tasks;
        setData(STORAGE_KEYS.TASKS, state.tasks);
      }
    },
    toggleSelectTask: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      if (state.selectedTaskIds.includes(id)) {
        state.selectedTaskIds = state.selectedTaskIds.filter((item) => item !== id);
      } else {
        state.selectedTaskIds.push(id);
      }
    },
    selectAllTasks: (state, action: PayloadAction<string[]>) => {
      state.selectedTaskIds = action.payload;
    },
    clearSelectedTasks: (state) => {
      state.selectedTaskIds = [];
    },
    bulkUpdateStatus: (state, action: PayloadAction<{ status: TaskStatus }>) => {
      if (state.selectedTaskIds.length === 0) return;
      state.undoStack.push({
        description: `Bulk update ${state.selectedTaskIds.length} tasks`,
        tasks: JSON.parse(JSON.stringify(state.tasks)),
      });
      state.redoStack = [];

      state.tasks.forEach((task) => {
        if (state.selectedTaskIds.includes(task.id)) {
          task.status = action.payload.status;
          task.updatedAt = new Date().toISOString();
        }
      });
      setData(STORAGE_KEYS.TASKS, state.tasks);
    },
    bulkUpdatePriority: (state, action: PayloadAction<{ priority: TaskPriority }>) => {
      if (state.selectedTaskIds.length === 0) return;
      state.undoStack.push({
        description: `Bulk update priority`,
        tasks: JSON.parse(JSON.stringify(state.tasks)),
      });
      state.redoStack = [];

      state.tasks.forEach((task) => {
        if (state.selectedTaskIds.includes(task.id)) {
          task.priority = action.payload.priority;
          task.updatedAt = new Date().toISOString();
        }
      });
      setData(STORAGE_KEYS.TASKS, state.tasks);
    },
    bulkDeleteTasks: (state) => {
      if (state.selectedTaskIds.length === 0) return;
      state.undoStack.push({
        description: `Bulk delete ${state.selectedTaskIds.length} tasks`,
        tasks: JSON.parse(JSON.stringify(state.tasks)),
      });
      state.redoStack = [];

      state.tasks = state.tasks.filter((t) => !state.selectedTaskIds.includes(t.id));
      state.selectedTaskIds = [];
      setData(STORAGE_KEYS.TASKS, state.tasks);
    },
    addAttachment: (state, action: PayloadAction<{ taskId: string; attachment: TaskAttachment }>) => {
      const task = state.tasks.find((t) => t.id === action.payload.taskId);
      if (task) {
        task.attachments.push(action.payload.attachment);
        setData(STORAGE_KEYS.TASKS, state.tasks);
      }
    },
    deleteAttachment: (state, action: PayloadAction<{ taskId: string; attachmentId: string }>) => {
      const task = state.tasks.find((t) => t.id === action.payload.taskId);
      if (task) {
        task.attachments = task.attachments.filter((a) => a.id !== action.payload.attachmentId);
        setData(STORAGE_KEYS.TASKS, state.tasks);
      }
    },
  },
});

export const {
  hydrateTasks,
  createTask,
  updateTask,
  moveTaskStatus,
  duplicateTask,
  deleteTask,
  restoreTask,
  undoLastAction,
  redoLastAction,
  toggleSelectTask,
  selectAllTasks,
  clearSelectedTasks,
  bulkUpdateStatus,
  bulkUpdatePriority,
  bulkDeleteTasks,
  addAttachment,
  deleteAttachment,
} = taskSlice.actions;

export default taskSlice.reducer;
