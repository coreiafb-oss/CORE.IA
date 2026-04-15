import React, { useMemo } from 'react';
import { BarChart3, Clock, AlertTriangle, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { useAppContext, SYSTEM_USERS } from '../context/AppContext';

const TaskDashboard = () => {
  const { tasks, taskStatuses } = useAppContext();

  // Metrics per user
  const userMetrics = useMemo(() => {
    return SYSTEM_USERS.map(user => {
      const userTasks = tasks.filter(t => t.assignees.includes(user.avatar));
      
      const completedTasks = userTasks.filter(t => t.statusId === 's4' || taskStatuses.find(s => s.id === t.statusId)?.name.includes('PRONTO'));
      const delayedTasks = userTasks.filter(t => t.dueDate && t.dueDate.includes('atrás') && t.statusId !== 's4');
      
      // Mock average execution time for layout purposes
      const avgExecutionTime = userTasks.length > 0 ? `${Math.floor(Math.random() * 5) + 2}h` : '0h';

      return {
        ...user,
        totalTasks: userTasks.length,
        completedTasks: completedTasks.length,
        delayedTasks: delayedTasks.length,
        avgExecutionTime
      };
    }).sort((a, b) => b.completedTasks - a.completedTasks);
  }, [tasks, taskStatuses]);

  return (
    <div className="flex-1 flex flex-col bg-[#141414] p-6 overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Inteligência de Dados (Tarefas)
          </h2>
          <p className="text-sm text-gray-500 mt-1">Desempenho da equipe e métricas de execução</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-[#1e1e1e] border border-[#2b2b2b] rounded-xl p-5 hover:border-primary/30 transition-all">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-sm font-medium text-gray-400">Total de Responsáveis</div>
          </div>
          <div className="text-2xl font-bold text-white">{SYSTEM_USERS.length}</div>
        </div>

        <div className="bg-[#1e1e1e] border border-[#2b2b2b] rounded-xl p-5 hover:border-green-500/30 transition-all">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <BarChart3 className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-sm font-medium text-gray-400">Tarefas Entregues Geral</div>
          </div>
          <div className="text-2xl font-bold text-white">{tasks.filter(t => t.statusId === 's4' || taskStatuses.find(s => s.id === t.statusId)?.name.includes('PRONTO')).length}</div>
        </div>

        <div className="bg-[#1e1e1e] border border-[#2b2b2b] rounded-xl p-5 hover:border-red-500/30 transition-all">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <div className="text-sm font-medium text-gray-400">Tarefas Atrasadas</div>
          </div>
          <div className="text-2xl font-bold text-white">{tasks.filter(t => t.dueDate && t.dueDate.includes('atrás') && t.statusId !== 's4').length}</div>
        </div>
      </div>

      {/* Metrics Table */}
      <div className="bg-[#1e1e1e] border border-[#2b2b2b] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#2b2b2b]">
          <h3 className="text-sm font-semibold text-white">Desempenho por Membro</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1a1a1a]">
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Membro da Equipe</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Volume (Total)</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Entregues</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Atrasadas</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Tempo Médio</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Desempenho</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2b2b2b]">
              {userMetrics.map((user, idx) => {
                const performancePct = user.totalTasks > 0 ? Math.round((user.completedTasks / user.totalTasks) * 100) : 0;
                return (
                  <motion.tr 
                    key={user.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full border border-[#333]" />
                        <span className="text-sm font-medium text-gray-200">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">{user.totalTasks}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-green-400">{user.completedTasks}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-red-400">{user.delayedTasks}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-blue-400">
                        <Clock className="w-3.5 h-3.5" />
                        {user.avgExecutionTime}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-[#333] rounded-full overflow-hidden w-24">
                          <div 
                            className="h-full rounded-full"
                            style={{ 
                              width: `${performancePct}%`,
                              backgroundColor: performancePct > 70 ? '#22c55e' : performancePct > 30 ? '#eab308' : '#ef4444'
                            }} 
                          />
                        </div>
                        <span className="text-xs text-gray-500 w-8">{performancePct}%</span>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TaskDashboard;
