import React, { useState, useRef } from 'react';
import { Plus, MoreHorizontal, Flag, GripVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../context/AppContext';
import { Task } from '../types';
import { TaskModal } from './ui/TaskModal';

const priorityConfig: Record<string, { color: string; label: string }> = {
  Urgent: { color: '#ef4444', label: 'Urgente' },
  High: { color: '#eab308', label: 'Alta' },
  Normal: { color: '#3b82f6', label: 'Normal' },
  Low: { color: '#9ca3af', label: 'Baixa' },
  None: { color: 'transparent', label: '' },
};

interface BoardViewProps {
  filteredTasks: Task[];
  searchQuery: string;
  filterPriority: string | null;
}

const BoardView = ({ filteredTasks, searchQuery, filterPriority }: BoardViewProps) => {
  const { setTasks, taskStatuses, addTask } = useAppContext();
  const [newTaskName, setNewTaskName] = useState('');
  const [addingToColumn, setAddingToColumn] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const dragItem = useRef<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const isFiltering = !!searchQuery || !!filterPriority;

  const handleDragStart = (taskId: string) => {
    dragItem.current = taskId;
  };

  const handleDragOver = (e: React.DragEvent, statusId: string) => {
    e.preventDefault();
    setDragOverId(statusId);
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDrop = (statusId: string) => {
    if (dragItem.current) {
      setTasks(prev =>
        prev.map(t => t.id === dragItem.current ? { ...t, statusId } : t)
      );
    }
    dragItem.current = null;
    setDragOverId(null);
  };

  const handleAddTask = (statusId: string) => {
    if (!newTaskName.trim()) {
      setAddingToColumn(null);
      return;
    }
    const newTask: Task = {
      id: `task-${Date.now()}`,
      name: newTaskName,
      statusId,
      assignees: ['https://i.pravatar.cc/150?img=11'],
      dueDate: '',
      priority: 'Normal' as any,
    };
    setTasks(prev => [...prev, newTask]);
    setNewTaskName('');
    setAddingToColumn(null);
  };

  return (
    <div className="flex gap-4 p-6 h-full overflow-x-auto custom-scrollbar">
      {taskStatuses.map(status => {
        const columnTasks = filteredTasks.filter(t => t.statusId === status.id);
        const isOver = dragOverId === status.id;

        // Hide empty columns when filtering
        if (isFiltering && columnTasks.length === 0) return null;

        return (
          <div
            key={status.id}
            className={`flex flex-col min-w-[280px] max-w-[320px] w-[300px] flex-shrink-0 rounded-xl transition-all duration-200 ${
              isOver ? 'bg-white/5 ring-2 ring-primary/40' : 'bg-[#1a1a1a]/50'
            }`}
            onDragOver={(e) => handleDragOver(e, status.id)}
            onDragLeave={handleDragLeave}
            onDrop={() => handleDrop(status.id)}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between px-3 py-3 border-b border-[#2b2b2b]">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: status.color }} />
                <span className="text-sm font-semibold text-gray-200">{status.name}</span>
                <span className="text-xs text-gray-500 bg-[#2b2b2b] px-1.5 py-0.5 rounded-full font-medium">
                  {columnTasks.length}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setAddingToColumn(status.id)}
                  className="p-1 text-gray-500 hover:text-gray-200 hover:bg-white/5 rounded transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button className="p-1 text-gray-500 hover:text-gray-200 hover:bg-white/5 rounded transition-colors">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Cards */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
              <AnimatePresence>
                {columnTasks.map(task => {
                  const prio = priorityConfig[task.priority] || priorityConfig.None;
                  return (
                    <motion.div
                      key={task.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      draggable
                      onDragStart={() => handleDragStart(task.id)}
                      className="bg-[#1e1e1e] border border-[#2b2b2b] rounded-lg p-3 cursor-grab active:cursor-grabbing hover:border-[#444] transition-all group shadow-sm hover:shadow-md"
                    >
                      {/* Priority bar */}
                      {task.priority !== 'None' && (
                        <div
                          className="w-full h-0.5 rounded-full mb-2"
                          style={{ backgroundColor: prio.color }}
                        />
                      )}

                      <div 
                        className="flex items-start justify-between gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setSelectedTask(task)}
                      >
                        <span className="text-sm text-gray-200 font-medium leading-snug flex-1">
                          {task.name}
                        </span>
                        <GripVertical className="w-3.5 h-3.5 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5" />
                      </div>

                      {/* Tags */}
                      {task.tags && task.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {task.tags.map(tag => (
                            <span
                              key={tag.name}
                              className="px-1.5 py-0.5 text-[10px] font-medium rounded"
                              style={{ color: tag.color, backgroundColor: tag.bgColor }}
                            >
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#2b2b2b]/50">
                        <div className="flex items-center gap-1.5">
                          {task.priority !== 'None' && (
                            <div className="flex items-center gap-1 text-[10px] font-medium" style={{ color: prio.color }}>
                              <Flag className="w-3 h-3" style={{ fill: prio.color }} />
                              {prio.label}
                            </div>
                          )}
                          {task.dueDate && (
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                              task.dueDate.includes('atrás') ? 'text-red-400 bg-red-500/10' : 'text-gray-400 bg-white/5'
                            }`}>
                              {task.dueDate}
                            </span>
                          )}
                        </div>
                        <div className="flex -space-x-1">
                          {task.assignees.slice(0, 2).map((avatar, i) => (
                            <img
                              key={i}
                              src={avatar}
                              alt="Assignee"
                              className="w-5 h-5 rounded-full border-2 border-[#1e1e1e]"
                            />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* Add Card Input */}
              {addingToColumn === status.id && (
                <div className="bg-[#1e1e1e] border border-primary/40 rounded-lg p-3 mt-1">
                  <input
                    type="text"
                    autoFocus
                    value={newTaskName}
                    onChange={(e) => setNewTaskName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newTaskName.trim()) {
                          const newTask: Task = {
                            id: `task-${Date.now()}`,
                            name: newTaskName,
                            statusId: status.id,
                            assignees: ['https://i.pravatar.cc/150?img=11'],
                            dueDate: '',
                            priority: 'Normal' as any,
                          };
                          setTasks(prev => [...prev, newTask]);
                          setNewTaskName('');
                        } else {
                           setAddingToColumn(null);
                        }
                      }
                      if (e.key === 'Escape') { setAddingToColumn(null); setNewTaskName(''); }
                    }}
                    onBlur={() => {
                        if (newTaskName.trim()) {
                            const newTask: Task = {
                              id: `task-${Date.now()}`,
                              name: newTaskName,
                              statusId: status.id,
                              assignees: ['https://i.pravatar.cc/150?img=11'],
                              dueDate: '',
                              priority: 'Normal' as any,
                            };
                            setTasks(prev => [...prev, newTask]);
                        }
                        setNewTaskName('');
                        setAddingToColumn(null);
                    }}
                    placeholder="Nome da tarefa... (Enter para adicionar ciclo)"
                    className="bg-transparent border-none outline-none text-[13px] text-white w-full placeholder-gray-600 font-medium"
                  />
                </div>
              )}
            </div>

            {/* Add Card Button */}
            {addingToColumn !== status.id && (
              <button
                onClick={() => setAddingToColumn(status.id)}
                className="flex items-center gap-1.5 px-3 py-2.5 text-sm text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors m-1 rounded-lg"
              >
                <Plus className="w-4 h-4" />
                Adicionar card
              </button>
            )}
          </div>
        );
      })}

      {/* Task Modal */}
      {selectedTask && (
        <TaskModal
          task={filteredTasks.find(t => t.id === selectedTask.id) || selectedTask}
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
};

export default BoardView;
