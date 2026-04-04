import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronRight, Plus, Flag, Calendar as CalendarIcon, MoreHorizontal, CheckCircle2, ArrowUp, Trash2, Edit3, ArrowRightLeft, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../context/AppContext';
import { useToast } from './Toast';
import { Task } from '../types';

interface ListViewProps {
  filteredTasks: Task[];
  searchQuery: string;
  filterPriority: string | null;
}

const ListView = ({ filteredTasks, searchQuery, filterPriority }: ListViewProps) => {
  const { tasks, setTasks, taskStatuses, addTask, deleteTask, updateTask, addTaskStatus } = useAppContext();
  const { showToast, ToastContainer } = useToast();
  const [newTaskName, setNewTaskName] = useState('');
  const [addingToStatus, setAddingToStatus] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<{ id: string; field: string } | null>(null);
  const [collapsedStatuses, setCollapsedStatuses] = useState<Set<string>>(new Set());
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [moveMenuTaskId, setMoveMenuTaskId] = useState<string | null>(null);
  const [addingNewStatus, setAddingNewStatus] = useState(false);
  const [newStatusName, setNewStatusName] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
        setMoveMenuTaskId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleCollapse = useCallback((statusId: string) => {
    setCollapsedStatuses(prev => {
      const next = new Set(prev);
      if (next.has(statusId)) next.delete(statusId);
      else next.add(statusId);
      return next;
    });
  }, []);

  const handleUpdateTask = useCallback((id: string, field: string, value: any) => {
    updateTask(id, { [field]: value });
    setEditingTask(null);
  }, [updateTask]);

  const handleAddTask = useCallback((statusId: string) => {
    if (!newTaskName.trim()) {
      setAddingToStatus(null);
      return;
    }
    addTask({
      name: newTaskName,
      statusId,
      assignees: ['https://i.pravatar.cc/150?img=11'],
      dueDate: 'Hoje',
      priority: 'Normal' as any,
    });
    setNewTaskName('');
    setAddingToStatus(null);
    // Show toast in next tick to avoid render-during-render
    setTimeout(() => showToast('Tarefa criada com sucesso'), 0);
  }, [newTaskName, addTask, showToast]);

  const handleDeleteTask = useCallback((taskId: string, taskName: string) => {
    const deletedTask = tasks.find(t => t.id === taskId);
    deleteTask(taskId);
    setOpenMenuId(null);
    setTimeout(() => {
      showToast(`"${taskName}" removida`, () => {
        if (deletedTask) setTasks(prev => [...prev, deletedTask]);
      });
    }, 0);
  }, [tasks, deleteTask, setTasks, showToast]);

  const handleDuplicateTask = useCallback((task: Task) => {
    addTask({
      name: `${task.name} (cópia)`,
      statusId: task.statusId,
      assignees: task.assignees,
      dueDate: task.dueDate,
      priority: task.priority as any,
      tags: task.tags,
    });
    setOpenMenuId(null);
    setTimeout(() => showToast('Tarefa duplicada'), 0);
  }, [addTask, showToast]);

  const handleMoveTask = useCallback((taskId: string, newStatusId: string) => {
    updateTask(taskId, { statusId: newStatusId });
    setOpenMenuId(null);
    setMoveMenuTaskId(null);
    setTimeout(() => showToast('Tarefa movida'), 0);
  }, [updateTask, showToast]);

  const handleAddStatus = useCallback(() => {
    if (!newStatusName.trim()) {
      setAddingNewStatus(false);
      return;
    }
    const colors = ['#e8384f', '#f2c744', '#fd7120', '#20c997', '#3b82f6', '#8b5cf6', '#ec4899'];
    const color = colors[taskStatuses.length % colors.length];
    addTaskStatus({ name: newStatusName.toUpperCase(), color });
    setNewStatusName('');
    setAddingNewStatus(false);
    setTimeout(() => showToast(`Status "${newStatusName}" criado`), 0);
  }, [newStatusName, taskStatuses.length, addTaskStatus, showToast]);

  const handleKeyDown = (e: React.KeyboardEvent, statusId: string) => {
    if (e.key === 'Enter') handleAddTask(statusId);
    else if (e.key === 'Escape') { setAddingToStatus(null); setNewTaskName(''); }
  };

  // Use filteredTasks (which has search + priority applied) from the parent
  const isFiltering = !!searchQuery || !!filterPriority;

  return (
    <div className="p-6 min-w-[800px]">
      {/* Filter indicator */}
      {isFiltering && (
        <div className="mb-4 px-4 py-2 bg-primary/5 border border-primary/20 rounded-lg flex items-center gap-2 text-xs text-primary">
          <span>Mostrando {filteredTasks.length} de {tasks.length} tarefas</span>
          {searchQuery && <span className="bg-primary/10 px-2 py-0.5 rounded">Busca: "{searchQuery}"</span>}
          {filterPriority && <span className="bg-primary/10 px-2 py-0.5 rounded">Prioridade: {filterPriority}</span>}
        </div>
      )}

      {/* Table Header */}
      <div className="flex items-center text-xs text-gray-500 font-medium border-b border-[#2b2b2b] pb-2 mb-4 px-4 pr-6">
        <div className="flex-1 pl-6">Nome</div>
        <div className="w-32">Responsável</div>
        <div className="w-40 flex items-center gap-1">
          Data de vencimento <ArrowUp className="w-3 h-3 text-primary" />
        </div>
        <div className="w-32">Prioridade</div>
        <div className="w-10 flex justify-center">
          <Plus className="w-4 h-4 cursor-pointer hover:text-gray-300" />
        </div>
      </div>

      <div className="space-y-6">
        {taskStatuses.map(status => {
          // Use filteredTasks so search/filter actually works in the UI
          const statusTasks = filteredTasks.filter(t => t.statusId === status.id);
          const isCollapsed = collapsedStatuses.has(status.id);

          // In filtering mode, hide empty status groups
          if (isFiltering && statusTasks.length === 0) return null;

          return (
            <div key={status.id} className="flex flex-col">
              {/* Status Header */}
              <div
                className="flex items-center gap-2 mb-2 group cursor-pointer sticky top-0 bg-[#141414] py-1 z-10"
                onClick={() => toggleCollapse(status.id)}
              >
                {isCollapsed ? (
                  <ChevronRight className="w-4 h-4 text-gray-500 hover:text-gray-300 transition-colors" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500 hover:text-gray-300 transition-colors" />
                )}
                <div
                  className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold text-white tracking-wide"
                  style={{ backgroundColor: status.color }}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  {status.name}
                </div>
                <span className="text-xs text-gray-500 font-medium">{statusTasks.length}</span>
                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 ml-2 transition-opacity">
                  <Plus
                    className="w-4 h-4 text-gray-400 hover:text-gray-200"
                    onClick={(e) => { e.stopPropagation(); setAddingToStatus(status.id); }}
                  />
                </div>
              </div>

              {/* Tasks List */}
              <AnimatePresence initial={false}>
                {!isCollapsed && (
                  <motion.div
                    key={`tasks-${status.id}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col border-l border-[#2b2b2b] ml-2 pl-4 overflow-hidden"
                  >
                    {statusTasks.map(task => (
                      <div
                        key={task.id}
                        className="flex items-center py-2 border-b border-[#2b2b2b] hover:bg-[#1e1e1e] group/row -ml-4 pl-4 pr-2 transition-colors relative"
                      >
                        <div className="flex-1 flex items-center gap-3">
                          <div
                            className="w-3.5 h-3.5 rounded-sm border-2 flex-shrink-0 cursor-pointer hover:bg-opacity-20 transition-colors"
                            style={{ borderColor: status.color }}
                            onClick={() => {
                              const currentIndex = taskStatuses.findIndex(s => s.id === task.statusId);
                              const nextStatus = taskStatuses[(currentIndex + 1) % taskStatuses.length];
                              updateTask(task.id, { statusId: nextStatus.id });
                            }}
                          />
                          {editingTask?.id === task.id && editingTask?.field === 'name' ? (
                            <input
                              type="text"
                              autoFocus
                              defaultValue={task.name}
                              onBlur={(e) => handleUpdateTask(task.id, 'name', e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleUpdateTask(task.id, 'name', e.currentTarget.value);
                                if (e.key === 'Escape') setEditingTask(null);
                              }}
                              className="bg-transparent border-b border-primary outline-none text-sm text-white w-full"
                            />
                          ) : (
                            <span
                              className="text-sm text-gray-200 font-medium cursor-pointer hover:text-primary transition-colors truncate"
                              onClick={() => setEditingTask({ id: task.id, field: 'name' })}
                            >
                              {task.name}
                            </span>
                          )}
                          {task.tags?.map(tag => (
                            <span
                              key={tag.name}
                              className="px-1.5 py-0.5 text-[10px] font-medium rounded border"
                              style={{ color: tag.color, backgroundColor: tag.bgColor, borderColor: tag.color + '40' }}
                            >
                              {tag.name}
                            </span>
                          ))}
                        </div>

                        <div className="w-32 flex items-center">
                          {task.assignees.map((avatar, i) => (
                            <img key={i} src={avatar} alt="Assignee" className="w-6 h-6 rounded-full border border-[#141414] cursor-pointer hover:ring-2 hover:ring-primary transition-all" />
                          ))}
                        </div>

                        <div className="w-40 flex items-center text-xs font-medium">
                          {editingTask?.id === task.id && editingTask?.field === 'dueDate' ? (
                            <input
                              type="text"
                              autoFocus
                              defaultValue={task.dueDate}
                              onBlur={(e) => handleUpdateTask(task.id, 'dueDate', e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleUpdateTask(task.id, 'dueDate', e.currentTarget.value);
                                if (e.key === 'Escape') setEditingTask(null);
                              }}
                              placeholder="Ex: Amanhã, 10/12"
                              className="bg-[#1e1e1e] border border-[#333] rounded px-2 py-1 outline-none text-xs text-white w-24"
                            />
                          ) : (
                            <div
                              className="flex items-center gap-1 cursor-pointer hover:text-gray-300 transition-colors w-full h-full"
                              onClick={() => setEditingTask({ id: task.id, field: 'dueDate' })}
                            >
                              {task.dueDate ? (
                                <span className={task.dueDate.includes('atrás') ? 'text-red-400' : 'text-gray-400'}>{task.dueDate}</span>
                              ) : (
                                <CalendarIcon className="w-4 h-4 text-gray-500 opacity-0 group-hover/row:opacity-100 transition-all" />
                              )}
                            </div>
                          )}
                        </div>

                        <div className="w-32 flex items-center relative">
                          {editingTask?.id === task.id && editingTask?.field === 'priority' ? (
                            <select
                              autoFocus
                              defaultValue={task.priority}
                              onBlur={(e) => handleUpdateTask(task.id, 'priority', e.target.value)}
                              onChange={(e) => handleUpdateTask(task.id, 'priority', e.target.value)}
                              className="bg-[#1e1e1e] border border-[#333] rounded px-2 py-1 outline-none text-xs text-white w-24 appearance-none"
                            >
                              <option value="Urgent">Urgente</option>
                              <option value="High">Alta</option>
                              <option value="Normal">Normal</option>
                              <option value="Low">Baixa</option>
                              <option value="None">Nenhuma</option>
                            </select>
                          ) : (
                            <div
                              className="cursor-pointer w-full h-full flex items-center"
                              onClick={() => setEditingTask({ id: task.id, field: 'priority' })}
                            >
                              <PriorityIcon priority={task.priority} />
                            </div>
                          )}
                        </div>

                        {/* Context Menu */}
                        <div className="w-10 flex justify-center relative" ref={openMenuId === task.id ? menuRef : undefined}>
                          <button
                            className="opacity-0 group-hover/row:opacity-100 transition-opacity p-1 hover:bg-white/5 rounded"
                            onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === task.id ? null : task.id); setMoveMenuTaskId(null); }}
                          >
                            <MoreHorizontal className="w-4 h-4 text-gray-400 hover:text-gray-200" />
                          </button>

                          <AnimatePresence>
                            {openMenuId === task.id && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                className="absolute right-0 top-full mt-1 bg-[#1e1e1e] border border-[#333] rounded-lg shadow-2xl z-50 w-48 py-1 overflow-hidden"
                              >
                                <button
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/5 transition-colors"
                                  onClick={() => { setEditingTask({ id: task.id, field: 'name' }); setOpenMenuId(null); }}
                                >
                                  <Edit3 className="w-3.5 h-3.5" /> Renomear
                                </button>
                                <button
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/5 transition-colors"
                                  onClick={() => handleDuplicateTask(task)}
                                >
                                  <Copy className="w-3.5 h-3.5" /> Duplicar
                                </button>
                                <button
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/5 transition-colors"
                                  onClick={() => setMoveMenuTaskId(moveMenuTaskId === task.id ? null : task.id)}
                                >
                                  <ArrowRightLeft className="w-3.5 h-3.5" /> Mover para...
                                </button>

                                {/* Move submenu */}
                                <AnimatePresence>
                                  {moveMenuTaskId === task.id && (
                                    <motion.div
                                      initial={{ height: 0 }}
                                      animate={{ height: 'auto' }}
                                      exit={{ height: 0 }}
                                      className="overflow-hidden border-t border-[#333]"
                                    >
                                      {taskStatuses.filter(s => s.id !== task.statusId).map(s => (
                                        <button
                                          key={s.id}
                                          className="w-full flex items-center gap-2 px-5 py-1.5 text-xs text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
                                          onClick={() => handleMoveTask(task.id, s.id)}
                                        >
                                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                                          {s.name}
                                        </button>
                                      ))}
                                    </motion.div>
                                  )}
                                </AnimatePresence>

                                <div className="border-t border-[#333] mt-1" />
                                <button
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                                  onClick={() => handleDeleteTask(task.id, task.name)}
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Deletar
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    ))}

                    {/* Add Task Input */}
                    {addingToStatus === status.id && (
                      <div className="flex items-center py-2 border-b border-[#2b2b2b] -ml-4 pl-4 pr-2">
                        <div className="flex-1 flex items-center gap-3">
                          <div
                            className="w-3.5 h-3.5 rounded-sm border-2 flex-shrink-0"
                            style={{ borderColor: status.color }}
                          />
                          <input
                            type="text"
                            autoFocus
                            value={newTaskName}
                            onChange={(e) => setNewTaskName(e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, status.id)}
                            onBlur={() => handleAddTask(status.id)}
                            placeholder="Nome da tarefa"
                            className="bg-transparent border-none outline-none text-sm text-white w-full placeholder-gray-600"
                          />
                        </div>
                      </div>
                    )}

                    {/* Add Task Row */}
                    {addingToStatus !== status.id && (
                      <div
                        className="flex items-center py-2 text-sm text-gray-500 hover:text-gray-300 cursor-pointer -ml-4 pl-4 group transition-colors"
                        onClick={() => setAddingToStatus(status.id)}
                      >
                        <Plus className="w-4 h-4 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                        Adicionar Tarefa
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {/* No results */}
        {isFiltering && filteredTasks.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-3">🔍</div>
            <div className="text-sm font-medium">Nenhuma tarefa encontrada</div>
            <div className="text-xs mt-1">Tente ajustar seus filtros</div>
          </div>
        )}

        {/* New Status */}
        {!isFiltering && (
          addingNewStatus ? (
            <div className="flex items-center gap-2 mt-4">
              <input
                type="text"
                autoFocus
                value={newStatusName}
                onChange={(e) => setNewStatusName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddStatus();
                  if (e.key === 'Escape') { setAddingNewStatus(false); setNewStatusName(''); }
                }}
                onBlur={() => handleAddStatus()}
                placeholder="Nome do novo status..."
                className="bg-[#1e1e1e] border border-[#333] rounded px-3 py-1.5 outline-none text-sm text-white placeholder-gray-600 w-56"
              />
            </div>
          ) : (
            <div
              className="flex items-center py-2 text-sm text-gray-500 hover:text-gray-300 cursor-pointer transition-colors mt-4"
              onClick={() => setAddingNewStatus(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo status
            </div>
          )
        )}
      </div>

      <ToastContainer />
    </div>
  );
};

const PriorityIcon = ({ priority }: { priority: string }) => {
  switch (priority) {
    case 'Urgent': return <div className="flex items-center gap-1.5 text-xs text-red-500"><Flag className="w-3.5 h-3.5 fill-red-500" /> Urgente</div>;
    case 'High': return <div className="flex items-center gap-1.5 text-xs text-yellow-500"><Flag className="w-3.5 h-3.5 fill-yellow-500" /> Alta</div>;
    case 'Normal': return <div className="flex items-center gap-1.5 text-xs text-blue-400"><Flag className="w-3.5 h-3.5 fill-blue-400" /> Normal</div>;
    case 'Low': return <div className="flex items-center gap-1.5 text-xs text-gray-400"><Flag className="w-3.5 h-3.5 fill-gray-400" /> Baixa</div>;
    default: return <Flag className="w-3.5 h-3.5 text-gray-600 opacity-0 group-hover/row:opacity-100 cursor-pointer hover:text-gray-400 transition-opacity" />;
  }
};

export default ListView;
