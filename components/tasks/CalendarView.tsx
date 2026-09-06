'use client';

import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { openTaskDetail, setCreateTaskOpen } from '@/store/slices/uiSlice';
import { Task } from '@/types/task';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Flame } from 'lucide-react';
import { canCreateTask } from '@/lib/permissions';

interface CalendarViewProps {
  filteredTasks: Task[];
}

export function CalendarView({ filteredTasks }: CalendarViewProps) {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const projects = useAppSelector((state) => state.project.projects);

  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // First day of current month (0: Sunday, 1: Monday, ...)
  const firstDayIndex = new Date(year, month, 1).getDay();
  // Total days in current month
  const totalDays = new Date(year, month + 1, 0).getDate();
  // Previous month total days
  const prevMonthTotalDays = new Date(year, month, 0).getDate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Calendar grid construction (42 cells: 6 weeks)
  const calendarCells: {
    day: number;
    isCurrentMonth: boolean;
    dateString: string;
    isToday: boolean;
  }[] = [];

  // 1. Previous month days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const day = prevMonthTotalDays - i;
    const d = new Date(year, month - 1, day);
    calendarCells.push({
      day,
      isCurrentMonth: false,
      dateString: d.toISOString().slice(0, 10),
      isToday: false,
    });
  }

  // 2. Current month days
  const todayStr = new Date().toISOString().slice(0, 10);
  for (let d = 1; d <= totalDays; d++) {
    const dateObj = new Date(year, month, d);
    const dateString = dateObj.toISOString().slice(0, 10);
    calendarCells.push({
      day: d,
      isCurrentMonth: true,
      dateString,
      isToday: dateString === todayStr,
    });
  }

  // 3. Next month days to pad up to multiple of 7 (or 35/42)
  const remainingCells = 42 - calendarCells.length;
  for (let d = 1; d <= remainingCells; d++) {
    const dateObj = new Date(year, month + 1, d);
    calendarCells.push({
      day: d,
      isCurrentMonth: false,
      dateString: dateObj.toISOString().slice(0, 10),
      isToday: false,
    });
  }

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-3 pb-8">
      {/* Navigation Header */}
      <div className="flex items-center justify-between p-3 rounded-2xl border border-[#E5E7EB] dark:border-[#222222] bg-white dark:bg-[#0A0A0A] shadow-sm">
        <div className="flex items-center space-x-3">
          <h3 className="text-base font-bold text-[#1A1D26] dark:text-white">
            {monthNames[month]} {year}
          </h3>
          <Button variant="outline" size="sm" onClick={handleToday} className="h-7 text-xs border-[#E5E7EB] dark:border-[#222222] text-[#1A1D26] dark:text-slate-300">
            Today
          </Button>
        </div>

        <div className="flex items-center space-x-1">
          <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-8 w-8 text-[#9C9FA6] hover:text-[#343A40]">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-8 w-8 text-[#9C9FA6] hover:text-[#343A40]">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="rounded-2xl border border-[#E5E7EB] dark:border-[#222222] bg-white dark:bg-[#0A0A0A] overflow-hidden shadow-sm">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-[#E5E7EB] dark:border-[#222222] bg-[#F6F7FB] dark:bg-[#111111] text-center text-xs font-bold uppercase tracking-wider text-[#7D8592] dark:text-[#888888] py-2.5">
          {daysOfWeek.map((day) => (
            <div key={day} className="py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Days cells */}
        <div className="grid grid-cols-7 divide-x divide-y divide-[#E5E7EB] dark:divide-[#222222]">
          {calendarCells.map((cell, idx) => {
            // Find tasks due on this calendar day
            const dayTasks = filteredTasks.filter(
              (t) => t.dueDate && t.dueDate.slice(0, 10) === cell.dateString
            );

            return (
              <div
                key={idx}
                className={`min-h-[110px] p-2 transition-colors relative flex flex-col justify-between ${
                  cell.isCurrentMonth
                    ? 'bg-transparent hover:bg-[#F2EDF3]/30 dark:hover:bg-slate-800/20'
                    : 'bg-[#F2EDF3]/40 text-[#9C9FA6] dark:bg-slate-950/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`inline-flex items-center justify-center text-xs font-bold rounded-full w-6 h-6 ${
                      cell.isToday
                        ? 'bg-gradient-to-r from-[#DA8CFF] to-[#9A55FF] text-white shadow-sm'
                        : cell.isCurrentMonth
                        ? 'text-[#343A40] dark:text-slate-300'
                        : 'text-[#9C9FA6]'
                    }`}
                  >
                    {cell.day}
                  </span>

                  {cell.isCurrentMonth && canCreateTask(currentUser?.role) && (
                    <button
                      type="button"
                      onClick={() =>
                        dispatch(
                          setCreateTaskOpen({
                            open: true,
                            defaultStatus: 'TODO',
                          })
                        )
                      }
                      className="opacity-0 hover:opacity-100 group-hover:opacity-100 p-0.5 rounded text-[#9C9FA6] hover:text-[#B66DFF]"
                      title="Add task on this date"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Day tasks cards */}
                <div className="space-y-1 flex-1 overflow-y-auto max-h-[80px]">
                  {dayTasks.map((task) => {
                    const project = projects.find((p) => p.id === task.projectId);
                    return (
                      <div
                        key={task.id}
                        onClick={() => dispatch(openTaskDetail(task.id))}
                        className={`px-1.5 py-1 rounded text-[11px] font-semibold truncate cursor-pointer transition-all border ${
                          task.status === 'DONE'
                            ? 'bg-[#1BD9B2]/15 text-[#1BD9B2] border-[#1BD9B2]/30'
                            : task.priority === 'URGENT'
                            ? 'bg-[#FE7C96]/15 text-[#FE7C96] border-[#FE7C96]/30'
                            : 'bg-[#B66DFF]/15 text-[#B66DFF] border-[#B66DFF]/30'
                        } hover:scale-[1.02] shadow-xs`}
                        title={`${task.title} (${task.status})`}
                      >
                        <span className="font-mono text-[9px] opacity-75 mr-1">
                          {project?.key || 'TSK'}
                        </span>
                        {task.title}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
