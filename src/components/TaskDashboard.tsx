import React, { useMemo } from 'react';
import { LayoutDashboard, CheckCircle2, AlertCircle, Users, BarChart3, Clock, AlertTriangle, ChevronRight, Activity } from 'lucide-react';
import { motion } from 'motion/react';
import { useAppContext } from '../context/AppContext';

const TaskDashboard = () => {
  const { tasks, taskStatuses, clients } = useAppContext();

  // Métricas Superiores
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.statusId === 's4' || taskStatuses.find(s => s.id === t.statusId)?.name.toUpperCase().includes('PRONTO')).length;
  const highPriorityTasks = tasks.filter(t => t.priority === 'High' || t.priority === 'Urgent').length;
  const activeClients = clients.length;

  // Por Status (Para as barras horizontais)
  const statusMetrics = useMemo(() => {
    return taskStatuses.map(status => {
      const count = tasks.filter(t => t.statusId === status.id).length;
      const percentage = totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0;
      return { ...status, count, percentage };
    }).filter(s => s.count > 0).sort((a, b) => b.count - a.count);
  }, [tasks, taskStatuses, totalTasks]);

  // Tarefas Recentes
  const recentTasks = useMemo(() => {
    return [...tasks].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()).slice(0, 5);
  }, [tasks]);

  // Tarefas Atrasadas para o Alerta
  const delayedTasks = tasks.filter(t => t.dueDate && t.dueDate.includes('atrás') && t.statusId !== 's4');

  return (
    <div className="flex-1 flex flex-col bg-[#0f0f0f] p-6 lg:p-8 overflow-y-auto custom-scrollbar text-white">
      {/* Header Estilo ClickUp */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2 tracking-tight">
            <LayoutDashboard className="w-6 h-6 text-primary" />
            Visão Geral do Workspace
          </h2>
          <p className="text-[13px] text-gray-500 mt-1">Resumo de tarefas, progresso e atividade recente.</p>
        </div>
      </div>

      {/* 4 Cards Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#141414] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <BarChart3 className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Total Tarefas</div>
          </div>
          <div className="text-3xl font-bold text-white">{totalTasks}</div>
        </div>

        <div className="bg-[#141414] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Concluídas</div>
          </div>
          <div className="text-3xl font-bold text-white">{completedTasks}</div>
        </div>

        <div className="bg-[#141414] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-500" />
            </div>
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Alta Prioridade</div>
          </div>
          <div className="text-3xl font-bold text-white">{highPriorityTasks}</div>
        </div>

        <div className="bg-[#141414] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Users className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Clientes Ativos</div>
          </div>
          <div className="text-3xl font-bold text-white">{activeClients}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Coluna Esquerda: Tarefas Recentes & Status */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Por Status (Barras Horizontais) */}
          <div className="bg-[#141414] border border-white/5 rounded-2xl p-6">
             <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2 uppercase tracking-wide">
               <Activity className="w-4 h-4 text-gray-400" /> Por Status
             </h3>
             <div className="flex flex-col gap-5">
               {statusMetrics.map((status, idx) => (
                 <motion.div 
                   key={status.id} 
                   initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }}
                   className="flex items-center gap-4"
                 >
                   <div className="w-32 text-xs font-semibold text-gray-400 truncate" title={status.name}>{status.name}</div>
                   <div className="flex-1 h-3 bg-[#0f0f0f] rounded-full overflow-hidden border border-white/5">
                     <div 
                       className="h-full rounded-full relative" 
                       style={{ width: `${Math.max(status.percentage, 2)}%`, backgroundColor: status.color }}
                     >
                       <div className="absolute inset-0 bg-white/20" />
                     </div>
                   </div>
                   <div className="w-12 text-right text-xs font-bold text-white">{status.count}</div>
                 </motion.div>
               ))}
               {statusMetrics.length === 0 && (
                 <p className="text-sm text-gray-500 italic">Nenhum dado de status disponível.</p>
               )}
             </div>
          </div>

          {/* Tarefas Recentes */}
          <div className="bg-[#141414] border border-white/5 rounded-2xl p-6">
             <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2 uppercase tracking-wide">
               <Clock className="w-4 h-4 text-gray-400" /> Tarefas Recentes
             </h3>
             <div className="flex flex-col gap-2">
               {recentTasks.map((task, idx) => {
                 const status = taskStatuses.find(s => s.id === task.statusId);
                 return (
                   <motion.div 
                     key={task.id}
                     initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                     className="flex items-center justify-between p-4 bg-[#1a1a1a] rounded-xl hover:bg-[#222] transition-colors border border-transparent hover:border-white/5 group cursor-pointer"
                   >
                     <div className="flex items-center gap-4">
                       <div className="w-2 h-2 rounded-full" style={{ backgroundColor: status?.color || '#555' }} />
                       <div>
                         <p className="text-sm font-bold text-gray-200 group-hover:text-primary transition-colors">{task.name}</p>
                         <p className="text-[11px] text-gray-500 mt-0.5">{status?.name || 'Sem Status'}</p>
                       </div>
                     </div>
                     <div className="flex items-center gap-4">
                        {task.dueDate && (
                          <span className="text-[10px] font-bold text-gray-500 bg-black/40 px-2 py-1 rounded border border-white/5">{task.dueDate}</span>
                        )}
                        <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
                     </div>
                   </motion.div>
                 );
               })}
               {recentTasks.length === 0 && (
                 <p className="text-sm text-gray-500 italic text-center py-4">Nenhuma tarefa criada recentemente.</p>
               )}
             </div>
          </div>

        </div>

        {/* Coluna Direita: Alertas */}
        <div className="flex flex-col gap-6">
          <div className="bg-[#141414] border border-white/5 rounded-2xl p-6 flex-1 flex flex-col">
             <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2 uppercase tracking-wide">
               <AlertTriangle className="w-4 h-4 text-gray-400" /> Alertas
             </h3>
             
             {delayedTasks.length === 0 ? (
               <div className="flex flex-col items-center justify-center flex-1 text-center bg-emerald-500/5 rounded-xl border border-emerald-500/10 p-6">
                 <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mb-4">
                   <CheckCircle2 className="w-6 h-6" />
                 </div>
                 <h4 className="text-sm font-bold text-emerald-400 mb-1">Tudo em dia!</h4>
                 <p className="text-xs text-emerald-500/60">Nenhuma tarefa atrasada no workspace.</p>
               </div>
             ) : (
               <div className="flex flex-col gap-3">
                 <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-2">
                   <h4 className="text-sm font-bold text-red-500 mb-1">Atenção Necessária</h4>
                   <p className="text-xs text-red-400/80">Você tem {delayedTasks.length} tarefa(s) atrasada(s).</p>
                 </div>
                 {delayedTasks.slice(0, 6).map(task => (
                   <div key={task.id} className="p-3 bg-[#1a1a1a] rounded-lg border border-red-500/10 flex items-start justify-between">
                     <p className="text-xs font-medium text-gray-300 line-clamp-2 pr-2">{task.name}</p>
                     <span className="text-[9px] font-bold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded whitespace-nowrap">{task.dueDate}</span>
                   </div>
                 ))}
                 {delayedTasks.length > 6 && (
                   <p className="text-xs text-center text-gray-500 mt-2">E outras {delayedTasks.length - 6} tarefas...</p>
                 )}
               </div>
             )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default TaskDashboard;
