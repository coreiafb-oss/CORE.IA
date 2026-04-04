import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, Flag, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../context/AppContext';
import { Task } from '../types';

const DAYS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const priorityColors: Record<string, string> = {
  Urgent: '#ef4444',
  High: '#eab308',
  Normal: '#3b82f6',
  Low: '#9ca3af',
  None: '#6b7280',
};

const CalendarView = () => {
  const { tasks, taskStatuses, addTask } = useAppContext();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [newTaskName, setNewTaskName] = useState('');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, daysInPrevMonth - i),
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({
        date: new Date(year, month, d),
        isCurrentMonth: true,
      });
    }

    // Next month days to fill grid
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      days.push({
        date: new Date(year, month + 1, d),
        isCurrentMonth: false,
      });
    }

    return days;
  }, [year, month]);

  // Parse task due dates into a date-keyed map
  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    tasks.forEach(task => {
      if (!task.dueDate) return;
      // Try to parse multiple formats
      let dateStr = '';
      const dd = task.dueDate;
      // Format: "DD/MM/YYYY"
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(dd)) {
        const [d, m, y] = dd.split('/');
        dateStr = `${y}-${m}-${d}`;
      }
      // Format: "DD/MM"
      else if (/^\d{2}\/\d{2}$/.test(dd)) {
        const [d, m] = dd.split('/');
        dateStr = `${year}-${m}-${d}`;
      }
      // Format: YYYY-MM-DD
      else if (/^\d{4}-\d{2}-\d{2}$/.test(dd)) {
        dateStr = dd;
      }
      // Special strings like "Hoje", "Amanhã"
      else if (dd.toLowerCase() === 'hoje') {
        dateStr = formatDateKey(new Date());
      } else if (dd.toLowerCase() === 'amanhã') {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        dateStr = formatDateKey(tomorrow);
      }
      // Skip unparseable like "4 dias atrás"
      else {
        return;
      }

      if (!map[dateStr]) map[dateStr] = [];
      map[dateStr].push(task);
    });
    return map;
  }, [tasks, year]);

  const today = formatDateKey(new Date());

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  const handleAddTask = (dateKey: string) => {
    if (!newTaskName.trim()) {
      setSelectedDate(null);
      return;
    }
    addTask({
      name: newTaskName,
      statusId: 's1',
      assignees: ['https://i.pravatar.cc/150?img=11'],
      dueDate: dateKey,
      priority: 'Normal' as any,
    });
    setNewTaskName('');
    setSelectedDate(null);
  };

  return (
    <div className="flex flex-col h-full p-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-white">
            {MONTHS_PT[month]} {year}
          </h2>
          <button
            onClick={goToday}
            className="text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-colors border border-primary/20"
          >
            Hoje
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextMonth}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 mb-2">
        {DAYS_PT.map(day => (
          <div key={day} className="text-center text-xs font-semibold text-gray-500 py-2 uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 flex-1 border-t border-l border-[#2b2b2b]">
        {calendarDays.map(({ date, isCurrentMonth }, idx) => {
          const dateKey = formatDateKey(date);
          const dayTasks = tasksByDate[dateKey] || [];
          const isToday = dateKey === today;
          const isSelected = dateKey === selectedDate;

          return (
            <div
              key={idx}
              onClick={() => setSelectedDate(isSelected ? null : dateKey)}
              className={`border-r border-b border-[#2b2b2b] p-1.5 min-h-[100px] flex flex-col cursor-pointer transition-colors relative group ${
                isCurrentMonth ? 'bg-[#141414]' : 'bg-[#0d0d0d]'
              } ${isSelected ? 'ring-1 ring-primary/50 bg-primary/5' : 'hover:bg-white/[0.02]'}`}
            >
              {/* Day Number */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${
                    isToday
                      ? 'bg-primary text-white font-bold'
                      : isCurrentMonth
                        ? 'text-gray-300'
                        : 'text-gray-600'
                  }`}
                >
                  {date.getDate()}
                </span>
                {isCurrentMonth && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedDate(dateKey); }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-500 hover:text-primary transition-all"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Tasks */}
              <div className="flex-1 space-y-0.5 overflow-hidden">
                {dayTasks.slice(0, 3).map(task => {
                  const status = taskStatuses.find(s => s.id === task.statusId);
                  return (
                    <div
                      key={task.id}
                      className="text-[10px] px-1.5 py-0.5 rounded truncate font-medium border-l-2 bg-white/5 hover:bg-white/10 transition-colors"
                      style={{ borderColor: status?.color || '#666' }}
                      title={task.name}
                    >
                      {task.name}
                    </div>
                  );
                })}
                {dayTasks.length > 3 && (
                  <span className="text-[9px] text-gray-500 font-medium px-1.5">
                    +{dayTasks.length - 3} mais
                  </span>
                )}
              </div>

              {/* Inline Add */}
              {isSelected && (
                <div className="mt-1" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    autoFocus
                    value={newTaskName}
                    onChange={(e) => setNewTaskName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddTask(dateKey);
                      if (e.key === 'Escape') { setSelectedDate(null); setNewTaskName(''); }
                    }}
                    onBlur={() => handleAddTask(dateKey)}
                    placeholder="Nova tarefa..."
                    className="w-full bg-[#1e1e1e] border border-primary/30 rounded px-1.5 py-0.5 text-[10px] text-white outline-none placeholder-gray-600"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default CalendarView;
