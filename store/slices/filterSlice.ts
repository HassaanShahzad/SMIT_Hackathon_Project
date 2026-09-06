import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TaskPriority, TaskStatus } from '@/types/task';
import { STORAGE_KEYS } from '@/lib/storageKeys';
import { getData, setData } from '@/lib/storage';

export type DueDateFilter = 'all' | 'today' | 'this_week' | 'overdue' | 'no_date';
export type SortField = 'dueDate' | 'priority' | 'createdAt' | 'title';
export type SortDirection = 'asc' | 'desc';

export interface SavedFilterPreset {
  id: string;
  name: string;
  searchQuery?: string;
  status?: TaskStatus[];
  priority?: TaskPriority[];
  assigneeId?: string | null;
  label?: string;
  dueDate?: DueDateFilter;
  onlyMyTasks?: boolean;
}

interface FilterState {
  searchQuery: string;
  selectedStatuses: TaskStatus[];
  selectedPriorities: TaskPriority[];
  selectedAssigneeId: string | null;
  selectedLabel: string | null;
  dueDateFilter: DueDateFilter;
  onlyMyTasks: boolean;
  sortField: SortField;
  sortDirection: SortDirection;
  groupBy: 'none' | 'status';
  savedPresets: SavedFilterPreset[];
}

const DEFAULT_PRESETS: SavedFilterPreset[] = [
  {
    id: 'preset_urgent',
    name: '🔥 Urgent Tasks',
    priority: ['URGENT', 'HIGH'],
  },
  {
    id: 'preset_in_prog',
    name: '⚡ In Progress',
    status: ['IN_PROGRESS'],
  },
  {
    id: 'preset_overdue',
    name: '⚠️ Overdue',
    dueDate: 'overdue',
  },
];

const initialState: FilterState = {
  searchQuery: '',
  selectedStatuses: [],
  selectedPriorities: [],
  selectedAssigneeId: null,
  selectedLabel: null,
  dueDateFilter: 'all',
  onlyMyTasks: false,
  sortField: 'createdAt',
  sortDirection: 'desc',
  groupBy: 'none',
  savedPresets: DEFAULT_PRESETS,
};

export const filterSlice = createSlice({
  name: 'filter',
  initialState,
  reducers: {
    hydrateFilters: (state) => {
      state.savedPresets = getData<SavedFilterPreset[]>(STORAGE_KEYS.FILTERS, DEFAULT_PRESETS);
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    toggleStatusFilter: (state, action: PayloadAction<TaskStatus>) => {
      if (state.selectedStatuses.includes(action.payload)) {
        state.selectedStatuses = state.selectedStatuses.filter((s) => s !== action.payload);
      } else {
        state.selectedStatuses.push(action.payload);
      }
    },
    togglePriorityFilter: (state, action: PayloadAction<TaskPriority>) => {
      if (state.selectedPriorities.includes(action.payload)) {
        state.selectedPriorities = state.selectedPriorities.filter((p) => p !== action.payload);
      } else {
        state.selectedPriorities.push(action.payload);
      }
    },
    setAssigneeFilter: (state, action: PayloadAction<string | null>) => {
      state.selectedAssigneeId = action.payload;
    },
    setLabelFilter: (state, action: PayloadAction<string | null>) => {
      state.selectedLabel = action.payload;
    },
    setDueDateFilter: (state, action: PayloadAction<DueDateFilter>) => {
      state.dueDateFilter = action.payload;
    },
    setOnlyMyTasks: (state, action: PayloadAction<boolean>) => {
      state.onlyMyTasks = action.payload;
    },
    setSorting: (
      state,
      action: PayloadAction<{ field: SortField; direction: SortDirection }>
    ) => {
      state.sortField = action.payload.field;
      state.sortDirection = action.payload.direction;
    },
    setGroupBy: (state, action: PayloadAction<'none' | 'status'>) => {
      state.groupBy = action.payload;
    },
    clearAllFilters: (state) => {
      state.searchQuery = '';
      state.selectedStatuses = [];
      state.selectedPriorities = [];
      state.selectedAssigneeId = null;
      state.selectedLabel = null;
      state.dueDateFilter = 'all';
      state.onlyMyTasks = false;
    },
    applyPreset: (state, action: PayloadAction<SavedFilterPreset>) => {
      state.searchQuery = action.payload.searchQuery || '';
      state.selectedStatuses = action.payload.status || [];
      state.selectedPriorities = action.payload.priority || [];
      state.selectedAssigneeId = action.payload.assigneeId || null;
      state.selectedLabel = action.payload.label || null;
      state.dueDateFilter = action.payload.dueDate || 'all';
      state.onlyMyTasks = !!action.payload.onlyMyTasks;
    },
    saveCurrentPreset: (state, action: PayloadAction<{ name: string }>) => {
      const newPreset: SavedFilterPreset = {
        id: `preset_${Date.now()}`,
        name: action.payload.name,
        searchQuery: state.searchQuery || undefined,
        status: state.selectedStatuses.length > 0 ? state.selectedStatuses : undefined,
        priority: state.selectedPriorities.length > 0 ? state.selectedPriorities : undefined,
        assigneeId: state.selectedAssigneeId,
        label: state.selectedLabel || undefined,
        dueDate: state.dueDateFilter !== 'all' ? state.dueDateFilter : undefined,
        onlyMyTasks: state.onlyMyTasks,
      };
      state.savedPresets.push(newPreset);
      setData(STORAGE_KEYS.FILTERS, state.savedPresets);
    },
    deletePreset: (state, action: PayloadAction<string>) => {
      state.savedPresets = state.savedPresets.filter((p) => p.id !== action.payload);
      setData(STORAGE_KEYS.FILTERS, state.savedPresets);
    },
  },
});

export const {
  hydrateFilters,
  setSearchQuery,
  toggleStatusFilter,
  togglePriorityFilter,
  setAssigneeFilter,
  setLabelFilter,
  setDueDateFilter,
  setOnlyMyTasks,
  setSorting,
  setGroupBy,
  clearAllFilters,
  applyPreset,
  saveCurrentPreset,
  deletePreset,
} = filterSlice.actions;

export default filterSlice.reducer;
