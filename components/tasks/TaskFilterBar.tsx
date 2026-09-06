'use client';

import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  setSearchQuery,
  toggleStatusFilter,
  togglePriorityFilter,
  setAssigneeFilter,
  setDueDateFilter,
  setOnlyMyTasks,
  setSorting,
  clearAllFilters,
  applyPreset,
  saveCurrentPreset,
  deletePreset,
  DueDateFilter,
  SortField,
} from '@/store/slices/filterSlice';
import { TaskStatus, TaskPriority } from '@/types/task';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Search,
  X,
  ArrowUpDown,
  User,
  Calendar,
  Bookmark,
  Plus,
  Trash2,
  Check,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';

const STATUSES: { value: TaskStatus; label: string; color: string }[] = [
  { value: 'BACKLOG', label: 'Backlog', color: '#7D8592' },
  { value: 'TODO', label: 'To Do', color: '#5D5FEF' },
  { value: 'IN_PROGRESS', label: 'In Progress', color: '#6C5DD3' },
  { value: 'DONE', label: 'Done', color: '#00D2B4' },
];

const PRIORITIES: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'URGENT', label: 'Urgent', color: '#FF754C' },
  { value: 'HIGH', label: 'High', color: '#FF8A65' },
  { value: 'MEDIUM', label: 'Medium', color: '#FFB74D' },
  { value: 'LOW', label: 'Low', color: '#00D2B4' },
];

const DUE_DATE_OPTIONS: { value: DueDateFilter; label: string }[] = [
  { value: 'all', label: 'All Dates' },
  { value: 'today', label: 'Due Today' },
  { value: 'this_week', label: 'Due This Week' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'no_date', label: 'No Due Date' },
];

const SORT_OPTIONS: { field: SortField; label: string }[] = [
  { field: 'createdAt', label: 'Creation Date' },
  { field: 'dueDate', label: 'Due Date' },
  { field: 'priority', label: 'Priority' },
  { field: 'title', label: 'Title' },
];

export function TaskFilterBar() {
  const dispatch = useAppDispatch();
  const filter = useAppSelector((state) => state.filter);
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const mockUsers = useAppSelector((state) => state.auth.mockUsers);

  const [presetNameInput, setPresetNameInput] = useState('');
  const [showPresetInput, setShowPresetInput] = useState(false);

  const activeFilterCount =
    (filter.searchQuery ? 1 : 0) +
    filter.selectedStatuses.length +
    filter.selectedPriorities.length +
    (filter.selectedAssigneeId ? 1 : 0) +
    (filter.selectedLabel ? 1 : 0) +
    (filter.dueDateFilter !== 'all' ? 1 : 0) +
    (filter.onlyMyTasks ? 1 : 0);

  const handleSavePreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!presetNameInput.trim()) return;
    dispatch(saveCurrentPreset({ name: presetNameInput.trim() }));
    toast.success(`Filter preset "${presetNameInput}" saved.`);
    setPresetNameInput('');
    setShowPresetInput(false);
  };

  const handleSortChange = (field: SortField) => {
    if (filter.sortField === field) {
      dispatch(
        setSorting({
          field,
          direction: filter.sortDirection === 'asc' ? 'desc' : 'asc',
        })
      );
    } else {
      dispatch(setSorting({ field, direction: 'desc' }));
    }
  };

  return (
    <div className="bg-white dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-[#222222] rounded-2xl p-3 sm:p-4 shadow-sm space-y-3 transition-colors">
      {/* Top Row: Search + Quick Filter Controls + Sort + Clear */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7D8592]" />
          <Input
            value={filter.searchQuery}
            onChange={(e) => dispatch(setSearchQuery(e.target.value))}
            placeholder="Search tasks by title, description, or label..."
            className="pl-9 pr-8 h-9 text-xs rounded-xl bg-[#F6F7FB] dark:bg-[#111111] border-[#E5E7EB] dark:border-[#222222] focus-visible:ring-[#5D5FEF]"
          />
          {filter.searchQuery && (
            <button
              onClick={() => dispatch(setSearchQuery(''))}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7D8592] hover:text-[#1A1D26] dark:hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Badges & Menus */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={`h-8 text-xs rounded-xl border-[#E5E7EB] dark:border-[#222222] gap-1.5 ${
                  filter.selectedStatuses.length > 0
                    ? 'border-[#5D5FEF] bg-[#ECEBFF] text-[#5D5FEF] dark:bg-[#1A1A1A] dark:text-white font-semibold'
                    : 'text-[#1A1D26] dark:text-slate-300'
                }`}
              >
                <span>Status</span>
                {filter.selectedStatuses.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-0.5 px-1 py-0 text-[10px] bg-[#5D5FEF] text-white"
                  >
                    {filter.selectedStatuses.length}
                  </Badge>
                )}
                <ChevronDown className="w-3 h-3 text-[#7D8592]" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-48 p-2 shadow-xl border-[#E5E7EB] dark:border-[#222222] bg-white dark:bg-[#0A0A0A]">
              <p className="text-[11px] font-bold text-[#7D8592] dark:text-[#888888] px-2 py-1 uppercase tracking-wider">
                Filter by Status
              </p>
              <div className="space-y-1 mt-1">
                {STATUSES.map((s) => (
                  <label
                    key={s.value}
                    className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-[#111111] cursor-pointer text-xs"
                  >
                    <Checkbox
                      checked={filter.selectedStatuses.includes(s.value)}
                      onCheckedChange={() => dispatch(toggleStatusFilter(s.value))}
                    />
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: s.color }}
                    />
                    <span className="text-[#1A1D26] dark:text-slate-200">
                      {s.label}
                    </span>
                  </label>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Priority Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={`h-8 text-xs rounded-xl border-[#E5E7EB] dark:border-[#222222] gap-1.5 ${
                  filter.selectedPriorities.length > 0
                    ? 'border-[#FF754C] bg-[#FFEBF3] text-[#FF754C] dark:bg-[#1A1A1A] dark:text-[#FF754C] font-semibold'
                    : 'text-[#1A1D26] dark:text-slate-300'
                }`}
              >
                <span>Priority</span>
                {filter.selectedPriorities.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-0.5 px-1 py-0 text-[10px] bg-[#FF754C] text-white"
                  >
                    {filter.selectedPriorities.length}
                  </Badge>
                )}
                <ChevronDown className="w-3 h-3 text-[#7D8592]" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-48 p-2 shadow-xl border-[#E5E7EB] dark:border-[#222222] bg-white dark:bg-[#0A0A0A]">
              <p className="text-[11px] font-bold text-[#7D8592] dark:text-[#888888] px-2 py-1 uppercase tracking-wider">
                Filter by Priority
              </p>
              <div className="space-y-1 mt-1">
                {PRIORITIES.map((p) => (
                  <label
                    key={p.value}
                    className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-[#111111] cursor-pointer text-xs"
                  >
                    <Checkbox
                      checked={filter.selectedPriorities.includes(p.value)}
                      onCheckedChange={() => dispatch(togglePriorityFilter(p.value))}
                    />
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: p.color }}
                    />
                    <span className="text-[#1A1D26] dark:text-slate-200">
                      {p.label}
                    </span>
                  </label>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Assignee Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={`h-8 text-xs rounded-xl border-[#E5E7EB] dark:border-[#222222] gap-1.5 ${
                  filter.selectedAssigneeId
                    ? 'border-[#0098DA] bg-[#E3F7FF] text-[#0098DA] dark:bg-[#1A1A1A] dark:text-[#00D2B4] font-semibold'
                    : 'text-[#1A1D26] dark:text-slate-300'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>
                  {filter.selectedAssigneeId
                    ? mockUsers.find((u) => u.id === filter.selectedAssigneeId)?.name || 'Assignee'
                    : 'Assignee'}
                </span>
                <ChevronDown className="w-3 h-3 text-[#7D8592]" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52 shadow-xl border-[#E5E7EB] dark:border-[#222222] bg-white dark:bg-[#0A0A0A]">
              <DropdownMenuLabel className="text-xs text-[#7D8592] dark:text-[#888888]">
                Filter by Assignee
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => dispatch(setAssigneeFilter(null))}
                className="text-xs cursor-pointer"
              >
                <span>All Assignees</span>
                {!filter.selectedAssigneeId && (
                  <Check className="w-3.5 h-3.5 ml-auto text-[#0098DA]" />
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#E5E7EB] dark:bg-[#222222]" />
              {mockUsers.map((u) => (
                <DropdownMenuItem
                  key={u.id}
                  onClick={() => dispatch(setAssigneeFilter(u.id))}
                  className="text-xs cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2 h-2 rounded-full bg-[#5D5FEF]" />
                    <span className="truncate">{u.name}</span>
                  </div>
                  {filter.selectedAssigneeId === u.id && (
                    <Check className="w-3.5 h-3.5 text-[#5D5FEF]" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Due Date Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={`h-8 text-xs rounded-xl border-[#E5E7EB] dark:border-[#222222] gap-1.5 ${
                  filter.dueDateFilter !== 'all'
                    ? 'border-[#FFB74D] bg-[#FFF8E1] text-[#F57C00] dark:bg-[#1A1A1A] dark:text-[#FFB74D] font-semibold'
                    : 'text-[#1A1D26] dark:text-slate-300'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  {DUE_DATE_OPTIONS.find((d) => d.value === filter.dueDateFilter)?.label || 'Due Date'}
                </span>
                <ChevronDown className="w-3 h-3 text-[#7D8592]" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 shadow-xl border-[#E5E7EB] dark:border-[#222222] bg-white dark:bg-[#0A0A0A]">
              <DropdownMenuLabel className="text-xs text-[#7D8592] dark:text-[#888888]">
                Filter by Due Date
              </DropdownMenuLabel>
              {DUE_DATE_OPTIONS.map((d) => (
                <DropdownMenuItem
                  key={d.value}
                  onClick={() => dispatch(setDueDateFilter(d.value))}
                  className="text-xs cursor-pointer flex items-center justify-between"
                >
                  <span>{d.label}</span>
                  {filter.dueDateFilter === d.value && (
                    <Check className="w-3.5 h-3.5 text-[#F57C00]" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Only My Tasks Toggle */}
          {currentUser && (
            <Button
              variant={filter.onlyMyTasks ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => dispatch(setOnlyMyTasks(!filter.onlyMyTasks))}
              className={`h-8 text-xs rounded-xl border-[#E5E7EB] dark:border-[#222222] gap-1.5 ${
                filter.onlyMyTasks
                  ? 'bg-[#5D5FEF] text-white dark:bg-white dark:text-black border-transparent shadow-sm'
                  : 'text-[#1A1D26] dark:text-slate-300'
              }`}
            >
              <span>My Tasks</span>
            </Button>
          )}

          {/* Sort By Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs rounded-xl border-[#E5E7EB] dark:border-[#222222] gap-1.5 text-[#1A1D26] dark:text-slate-300"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-[#7D8592]" />
                <span>
                  Sort: {SORT_OPTIONS.find((s) => s.field === filter.sortField)?.label} ({filter.sortDirection.toUpperCase()})
                </span>
                <ChevronDown className="w-3 h-3 text-[#7D8592]" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 shadow-xl border-[#E5E7EB] dark:border-[#222222] bg-white dark:bg-[#0A0A0A]">
              <DropdownMenuLabel className="text-xs text-[#7D8592] dark:text-[#888888]">
                Sort Tasks
              </DropdownMenuLabel>
              {SORT_OPTIONS.map((s) => (
                <DropdownMenuItem
                  key={s.field}
                  onClick={() => handleSortChange(s.field)}
                  className="text-xs cursor-pointer flex items-center justify-between"
                >
                  <span>{s.label}</span>
                  {filter.sortField === s.field && (
                    <span className="text-[10px] font-bold text-[#5D5FEF] dark:text-white">
                      {filter.sortDirection === 'asc' ? '↑ ASC' : '↓ DESC'}
                    </span>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Clear Filters Button */}
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => dispatch(clearAllFilters())}
              className="h-8 text-xs text-[#FF754C] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 gap-1"
            >
              <X className="w-3 h-3" />
              <span>Reset ({activeFilterCount})</span>
            </Button>
          )}
        </div>
      </div>

      {/* Bottom Row: Presets Ribbon */}
      <div className="pt-2 border-t border-[#E5E7EB] dark:border-[#222222] flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-bold text-[#7D8592] dark:text-[#888888] flex items-center gap-1 mr-1">
            <Bookmark className="w-3 h-3" /> Presets:
          </span>
          {filter.savedPresets.map((preset) => (
            <div
              key={preset.id}
              className="inline-flex items-center rounded-lg bg-[#F6F7FB] dark:bg-[#111111] border border-[#E5E7EB] dark:border-[#222222] overflow-hidden"
            >
              <button
                onClick={() => dispatch(applyPreset(preset))}
                className="px-2.5 py-1 text-xs text-[#1A1D26] dark:text-slate-200 hover:text-[#5D5FEF] dark:hover:text-white font-medium transition-colors"
              >
                {preset.name}
              </button>
              {preset.id.startsWith('preset_custom_') && (
                <button
                  onClick={() => dispatch(deletePreset(preset.id))}
                  className="px-1.5 py-1 text-[#7D8592] hover:text-rose-500 transition-colors border-l border-[#E5E7EB] dark:border-[#222222]"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Save Current Preset Trigger */}
        {showPresetInput ? (
          <form onSubmit={handleSavePreset} className="flex items-center gap-1.5">
            <Input
              value={presetNameInput}
              onChange={(e) => setPresetNameInput(e.target.value)}
              placeholder="Preset name..."
              className="h-7 text-xs w-36 rounded-lg bg-[#F6F7FB] dark:bg-[#111111] border-[#E5E7EB] dark:border-[#222222]"
              autoFocus
            />
            <Button
              type="submit"
              size="sm"
              className="h-7 px-2.5 text-xs bg-[#5D5FEF] hover:bg-[#4E50E6] text-white rounded-lg"
            >
              Save
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowPresetInput(false)}
              className="h-7 px-2 text-xs"
            >
              Cancel
            </Button>
          </form>
        ) : (
          <button
            onClick={() => setShowPresetInput(true)}
            className="text-[11px] font-semibold text-[#5D5FEF] dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Save current filter
          </button>
        )}
      </div>
    </div>
  );
}
