import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, DollarSign, Users, Calendar, CheckSquare, Clock, ArrowUpRight, ArrowDownRight, Video, Briefcase, Target, Activity } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useAppContext } from '../context/AppContext';

const getTodayStr = () => new Date().toISOString().split('T')[0];
const toIsoDate = (d: string) => {
  if (d.includes('/')) {
    const p = d.split('/');
    return p.length === 2 ? `${new Date().getFullYear()}-${p[1]}-${p[0]}` : `${p[2]}-${p[1]}-${p[0]}`;
  }
  if (d.toLowerCase() === 'hoje') return getTodayStr();
  return d;
};

const formatCurrency = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`;

const Dashboard = ({ onNavigate }: { onNavigate: (tab: any) => void }) => {
  const { leads, transactions, contentItems, meetings, tasks } = useAppContext();
  const today = getTodayStr();

  // ─── Calculations ──────────────────────────────────────
  const pipelineValue = useMemo(() => leads
    .filter(l => l.columnId !== 'ganho' && l.columnId !== 'perdido')
    .reduce((acc, curr) => acc + curr.value, 0), [leads]);
    
  const revenue = useMemo(() => transactions
    .filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0), [transactions]);
  const expenses = useMemo(() => transactions
    .filter(t => t.type === 'expense').reduce((acc, curr) => acc + Math.abs(curr.amount), 0), [transactions]);
  const profit = revenue - expenses;

  const pendingContents = useMemo(() => contentItems.filter(c => c.status !== 'APROVADO'), [contentItems]);
  const pendingTasks = useMemo(() => tasks.filter(t => t.statusId !== 's4'), [tasks]);

  const contentData = useMemo(() => [
    { name: 'Pendente', value: contentItems.filter(c => c.status === 'PENDENTE').length, color: '#6366f1' },
    { name: 'Revisão', value: contentItems.filter(c => c.status === 'REVISÃO').length, color: '#f59e0b' },
    { name: 'Aprovado', value: contentItems.filter(c => c.status === 'APROVADO').length, color: '#10b981' },
  ].filter(d => d.value > 0), [contentItems]);

  const todaysMeetings = useMemo(() => meetings
    .filter(m => toIsoDate(m.date) === today || m.date.toLowerCase() === 'hoje')
    .sort((a, b) => a.time.localeCompare(b.time)), [meetings, today]);

  const topLeads = useMemo(() => leads
    .filter(l => l.columnId !== 'ganho' && l.columnId !== 'perdido')
    .sort((a, b) => b.value - a.value)
    .slice(0, 4), [leads]);

  const crmBarData = useMemo(() => {
    const cols = [
      { id: 'leads', name: 'Leads', color: '#6366f1' },
      { id: 'agendada', name: 'Reunião', color: '#8b5cf6' },
      { id: 'proposta', name: 'Proposta', color: '#f59e0b' },
      { id: 'ganho', name: 'Ganho', color: '#10b981' },
    ];
    return cols.map(c => ({
      name: c.name,
      valor: leads.filter(l => l.columnId === c.id).reduce((acc, curr) => acc + curr.value, 0),
      fill: c.color,
    }));
  }, [leads]);

  const stagger = (i: number) => ({ initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.05, duration: 0.35 } });

  // ─── KPI Cards Config ──────────────────────────────────
  const kpis = [
    { label: 'Pipeline Ativo', value: formatCurrency(pipelineValue), icon: Target, color: 'red', tab: 'crm' as const, sub: `${leads.filter(l => l.columnId !== 'ganho' && l.columnId !== 'perdido').length} leads abertos` },
    { label: 'Lucro Líquido', value: formatCurrency(profit), icon: DollarSign, color: profit >= 0 ? 'emerald' : 'red', tab: 'financeiro' as const, sub: `Margem ${revenue > 0 ? ((profit / revenue) * 100).toFixed(0) : 0}%` },
    { label: 'Aprovações', value: `${pendingContents.length}`, icon: CheckSquare, color: 'amber', tab: 'aprovacao' as const, sub: 'itens pendentes' },
    { label: 'Tarefas Ativas', value: `${pendingTasks.length}`, icon: Activity, color: 'violet', tab: 'gestor' as const, sub: 'em andamento' },
  ];

  const colorMap: Record<string, { bg: string; text: string; glow: string; border: string }> = {
    red:  { bg: 'bg-red-500/10', text: 'text-red-400', glow: 'hover:shadow-red-500/5', border: 'hover:border-red-500/20' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', glow: 'hover:shadow-emerald-500/5', border: 'hover:border-emerald-500/20' },
    red:     { bg: 'bg-red-500/10', text: 'text-red-400', glow: 'hover:shadow-red-500/5', border: 'hover:border-red-500/20' },
    amber:   { bg: 'bg-amber-500/10', text: 'text-amber-400', glow: 'hover:shadow-amber-500/5', border: 'hover:border-amber-500/20' },
    violet:  { bg: 'bg-violet-500/10', text: 'text-violet-400', glow: 'hover:shadow-violet-500/5', border: 'hover:border-violet-500/20' },
  };

  return (
    <div className="p-6 lg:p-8 h-full overflow-y-auto custom-scrollbar" style={{ background: 'var(--surface-0)' }}>
      <div className="max-w-[1400px] mx-auto space-y-6">

        {/* ─── Header ──────────────────────────── */}
        <motion.div {...stagger(0)} className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight mb-1">Dashboard</h1>
            <p className="text-[13px] text-zinc-500">Visão geral da operação em tempo real.</p>
          </div>
          <div className="text-right hidden md:block">
            <div className="text-[13px] font-medium text-zinc-400">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).replace(/^\w/, c => c.toUpperCase())}
            </div>
          </div>
        </motion.div>

        {/* ─── KPI Row ─────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi, i) => {
            const colors = colorMap[kpi.color];
            const Icon = kpi.icon;
            return (
              <motion.div
                key={kpi.label}
                {...stagger(i + 1)}
                whileHover={{ y: -2 }}
                onClick={() => onNavigate(kpi.tab)}
                className={`relative cursor-pointer rounded-xl p-5 transition-all duration-200 group ${colors.glow} ${colors.border} hover:shadow-xl`}
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-9 h-9 rounded-lg ${colors.bg} flex items-center justify-center ${colors.text}`}>
                    <Icon className="w-[18px] h-[18px]" strokeWidth={1.75} />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-zinc-700 group-hover:text-zinc-400 transition-colors" />
                </div>
                <div className="text-xl font-bold text-white tracking-tight mb-0.5">{kpi.value}</div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-zinc-500 font-medium">{kpi.label}</span>
                  <span className={`text-[10px] font-medium ${colors.text}`}>{kpi.sub}</span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ─── Content Grid ────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

          {/* Meu Dia */}
          <motion.div {...stagger(5)} className="rounded-xl p-5 flex flex-col" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[13px] font-semibold text-zinc-200 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-red-400" strokeWidth={1.75} /> Meu Dia
              </h3>
              <button onClick={() => onNavigate('agendamento')} className="text-[11px] text-zinc-500 hover:text-zinc-300 font-medium transition-colors">
                Ver tudo →
              </button>
            </div>
            
            <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-1">
              {todaysMeetings.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center py-10">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ background: 'var(--surface-3)' }}>
                    <Calendar className="w-5 h-5 text-zinc-600" />
                  </div>
                  <p className="text-xs text-zinc-600">Dia livre — sem reuniões agendadas</p>
                </div>
              ) : (
                todaysMeetings.map((m, i) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="relative rounded-lg p-3 group hover:bg-white/[0.03] transition-colors cursor-pointer"
                    style={{ border: '1px solid var(--border-subtle)' }}
                  >
                    <div className="absolute left-0 top-3 bottom-3 w-[2px] rounded-r-full bg-red-500/60" />
                    <div className="pl-2.5">
                      <div className="text-[13px] font-medium text-zinc-200 mb-1.5 group-hover:text-white transition-colors">{m.title}</div>
                      <div className="flex items-center gap-3 text-[11px] text-zinc-500">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{m.time}</span>
                        {m.platform && <span className="flex items-center gap-1 text-red-400/80"><Video className="w-3 h-3" />{m.platform}</span>}
                      </div>
                      {m.client && <div className="mt-1.5 text-[11px] text-zinc-600 flex items-center gap-1"><Users className="w-3 h-3" />{m.client}</div>}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>

          {/* Status de Conteúdos */}
          <motion.div {...stagger(6)} className="rounded-xl p-5 flex flex-col" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[13px] font-semibold text-zinc-200 flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-amber-400" strokeWidth={1.75} /> Conteúdos
              </h3>
              <button onClick={() => onNavigate('aprovacao')} className="text-[11px] text-zinc-500 hover:text-zinc-300 font-medium transition-colors">
                Revisar →
              </button>
            </div>
            
            <div className="flex-1 flex flex-col">
              {contentData.length > 0 ? (
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-28 h-28 flex-shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={contentData} innerRadius={32} outerRadius={48} dataKey="value" stroke="none" paddingAngle={4}>
                          {contentData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-3">
                    {contentData.map(d => (
                      <div key={d.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                          <span className="text-[12px] text-zinc-400">{d.name}</span>
                        </div>
                        <span className="text-[13px] font-semibold text-zinc-200">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-xs text-zinc-600">Tudo aprovado ✓</p>
                </div>
              )}

              {pendingContents.length > 0 && (
                <div className="pt-3 space-y-1.5" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                  <div className="text-[10px] text-zinc-600 font-medium uppercase tracking-wider mb-2">Pendentes</div>
                  {pendingContents.slice(0, 3).map(c => (
                    <div
                      key={c.id}
                      onClick={() => onNavigate('aprovacao')}
                      className="flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer hover:bg-white/[0.03] transition-colors"
                      style={{ border: '1px solid var(--border-subtle)' }}
                    >
                      <span className="text-[12px] text-zinc-300 truncate pr-3 font-medium">{c.title}</span>
                      <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase flex-shrink-0 ${
                        c.status === 'PENDENTE' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'
                      }`}>{c.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Pipeline (Bar Chart + Top Deals) */}
          <motion.div {...stagger(7)} className="rounded-xl p-5 flex flex-col" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[13px] font-semibold text-zinc-200 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-violet-400" strokeWidth={1.75} /> Pipeline
              </h3>
              <button onClick={() => onNavigate('crm')} className="text-[11px] text-zinc-500 hover:text-zinc-300 font-medium transition-colors">
                CRM →
              </button>
            </div>

            {/* Mini bar chart */}
            <div className="h-32 mb-4 -mx-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={crmBarData} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v / 1000}k`} />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                    contentStyle={{ background: 'var(--surface-3)', border: '1px solid var(--border-default)', borderRadius: '8px', fontSize: '12px', color: '#fafafa' }}
                    formatter={(v: number) => [formatCurrency(v), '']}
                  />
                  <Bar dataKey="valor" radius={[4, 4, 0, 0]} barSize={24}>
                    {crmBarData.map((entry, idx) => <Cell key={idx} fill={entry.fill} opacity={0.8} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Top deals */}
            <div className="pt-3 space-y-1.5" style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <div className="text-[10px] text-zinc-600 font-medium uppercase tracking-wider mb-2">Top Deals</div>
              {topLeads.map((l, i) => (
                <div key={l.id} className="flex items-center justify-between py-1.5 group">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center flex-shrink-0 bg-red-500/10 text-red-400">{i + 1}</span>
                    <span className="text-[12px] text-zinc-300 truncate font-medium group-hover:text-white transition-colors">{l.title}</span>
                  </div>
                  <span className="text-[12px] font-semibold text-emerald-400 flex-shrink-0 ml-2">{formatCurrency(l.value)}</span>
                </div>
              ))}
              {topLeads.length === 0 && <p className="text-xs text-zinc-600 text-center py-3">Pipeline vazio</p>}
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
