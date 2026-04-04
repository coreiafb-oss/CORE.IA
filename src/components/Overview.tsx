import React, { useMemo } from 'react';
import { Layers, Clock, CheckCircle2, Flag, TrendingUp, Users, AlertTriangle, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { useAppContext } from '../context/AppContext';

const Overview = () => {
  const { tasks, taskStatuses, clients, clientStatuses } = useAppContext();

  // Task stats
  const tasksByStatus = useMemo(() => {
    return taskStatuses.map(s => ({
      ...s,
      count: tasks.filter(t => t.statusId === s.id).length,
    }));
  }, [tasks, taskStatuses]);

  const totalTasks = tasks.length;
  const completedStatusId = taskStatuses.find(s => s.name.includes('PRONTO'))?.id;
  const completedCount = completedStatusId ? tasks.filter(t => t.statusId === completedStatusId).length : 0;
  const progressPct = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  const urgentTasks = useMemo(() => tasks.filter(t => t.priority === 'Urgent' || t.priority === 'High'), [tasks]);
  const overdueTasks = useMemo(() => tasks.filter(t => t.dueDate?.includes('atrás')), [tasks]);
  const recentTasks = useMemo(() => [...tasks].reverse().slice(0, 5), [tasks]);

  // Client stats
  const activeClients = useMemo(() => {
    const activeStatusId = clientStatuses.find(s => s.name.includes('ACTIVE'))?.id;
    return activeStatusId ? clients.filter(c => c.statusId === activeStatusId).length : clients.length;
  }, [clients, clientStatuses]);

  return (
    <div className="flex-1 flex flex-col bg-[#141414] p-6 overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            Visão Geral do Workspace
          </h2>
          <p className="text-xs text-gray-500 mt-1">Resumo de tarefas, progresso e atividade recente</p>
        </div>
        <div className="text-xs text-gray-500 flex items-center gap-1">
          <Clock className="w-3 h-3" /> Atualizado agora
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <motion.div whileHover={{ y: -2 }} className="bg-[#1e1e1e] border border-[#2b2b2b] rounded-xl p-4 hover:border-primary/30 transition-all">
          <div className="text-xs text-gray-500 font-medium mb-2 uppercase tracking-wider">Total Tarefas</div>
          <div className="text-2xl font-bold text-white">{totalTasks}</div>
          <div className="mt-2 flex items-center gap-1">
            <div className="flex-1 h-1.5 bg-[#2b2b2b] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary to-blue-500 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
            </div>
            <span className="text-[10px] text-gray-400 font-medium ml-1">{progressPct}%</span>
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="bg-[#1e1e1e] border border-[#2b2b2b] rounded-xl p-4 hover:border-green-500/30 transition-all">
          <div className="text-xs text-gray-500 font-medium mb-2 uppercase tracking-wider">Concluídas</div>
          <div className="text-2xl font-bold text-green-400">{completedCount}</div>
          <div className="text-[10px] text-gray-500 mt-2 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-green-500" /> de {totalTasks} tarefas
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="bg-[#1e1e1e] border border-[#2b2b2b] rounded-xl p-4 hover:border-yellow-500/30 transition-all">
          <div className="text-xs text-gray-500 font-medium mb-2 uppercase tracking-wider">Alta Prioridade</div>
          <div className="text-2xl font-bold text-yellow-400">{urgentTasks.length}</div>
          <div className="text-[10px] text-gray-500 mt-2 flex items-center gap-1">
            <Flag className="w-3 h-3 text-yellow-500 fill-yellow-500" /> Urgentes + Altas
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="bg-[#1e1e1e] border border-[#2b2b2b] rounded-xl p-4 hover:border-blue-500/30 transition-all">
          <div className="text-xs text-gray-500 font-medium mb-2 uppercase tracking-wider">Clientes Ativos</div>
          <div className="text-2xl font-bold text-blue-400">{activeClients}</div>
          <div className="text-[10px] text-gray-500 mt-2 flex items-center gap-1">
            <Users className="w-3 h-3 text-blue-500" /> de {clients.length} total
          </div>
        </motion.div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        {/* Status Breakdown */}
        <div className="bg-[#1e1e1e] border border-[#2b2b2b] rounded-xl p-4 col-span-1">
          <h3 className="text-sm font-semibold text-gray-200 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> Por Status
          </h3>
          <div className="space-y-3">
            {tasksByStatus.map(s => (
              <div key={s.id}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-xs text-gray-300 font-medium">{s.name}</span>
                  </div>
                  <span className="text-xs text-gray-500 font-bold">{s.count}</span>
                </div>
                <div className="h-1.5 bg-[#2b2b2b] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: totalTasks > 0 ? `${(s.count / totalTasks) * 100}%` : '0%' }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: s.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="bg-[#1e1e1e] border border-[#2b2b2b] rounded-xl p-4 col-span-1">
          <h3 className="text-sm font-semibold text-gray-200 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400" /> Tarefas Recentes
          </h3>
          {recentTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-10 h-10 rounded-full bg-[#2b2b2b] flex items-center justify-center mb-2">
                <Layers className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-xs text-gray-500">Nenhuma tarefa ainda.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentTasks.map(task => {
                const status = taskStatuses.find(s => s.id === task.statusId);
                return (
                  <div key={task.id} className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-white/5 transition-colors group">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: status?.color || '#666' }} />
                    <span className="text-xs text-gray-300 truncate flex-1 group-hover:text-white transition-colors">{task.name}</span>
                    {task.priority !== 'None' && (
                      <Flag className="w-3 h-3 flex-shrink-0" style={{ color: task.priority === 'Urgent' ? '#ef4444' : task.priority === 'High' ? '#eab308' : '#3b82f6', fill: task.priority === 'Urgent' ? '#ef4444' : task.priority === 'High' ? '#eab308' : '#3b82f6' }} />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Overdue / Alerts */}
        <div className="bg-[#1e1e1e] border border-[#2b2b2b] rounded-xl p-4 col-span-1">
          <h3 className="text-sm font-semibold text-gray-200 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" /> Alertas
          </h3>
          {overdueTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center mb-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-xs text-gray-500">Tudo em dia! Nenhuma tarefa atrasada. 🎉</p>
            </div>
          ) : (
            <div className="space-y-2">
              {overdueTasks.map(task => (
                <div key={task.id} className="flex items-center gap-2 py-1.5 px-2 rounded-lg bg-red-500/5 border border-red-500/10">
                  <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0" />
                  <span className="text-xs text-gray-300 truncate flex-1">{task.name}</span>
                  <span className="text-[10px] text-red-400 font-medium flex-shrink-0">{task.dueDate}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Overview;
