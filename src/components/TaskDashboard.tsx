import React, { useState, useMemo, useEffect } from 'react';
import { 
  ChevronDown, ChevronRight, Calendar, Sparkles, CheckCircle2, 
  Settings, Inbox, Flag, MoreHorizontal, Plus, Circle, CalendarDays,
  GripVertical, LayoutDashboard
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Responsive, Layout } from 'react-grid-layout';
// @ts-ignore
import { WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

import { useAppContext } from '../context/AppContext';
import { Task } from '../types';
import { useAuth } from '../context/AuthContext';
import { format, isToday, isPast, parseISO, isValid } from 'date-fns';
import { TaskModal } from './ui/TaskModal';
import { ManageCardsModal } from './ui/ManageCardsModal';
import useLocalStorage from '../hooks/useLocalStorage';

const ResponsiveGridLayout = WidthProvider(Responsive);

// Prioridades do ClickUp
const PRIORITY_CONFIG: Record<string, { label: string; color: string; flag: string }> = {
  Urgent: { label: 'Urgente', color: '#ef4444', flag: '#ef4444' },
  High:   { label: 'Alta',    color: '#f59e0b', flag: '#f59e0b' },
  Normal: { label: 'Normal',  color: '#3b82f6', flag: '#3b82f6' },
  Low:    { label: 'Baixa',   color: '#6b7280', flag: '#6b7280' },
  None:   { label: '',        color: 'transparent', flag: '#374151' },
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '';
  const d = parseISO(dateStr);
  if (!isValid(d)) return dateStr;
  return format(d, 'M/d/yy');
};

const isOverdue = (dateStr?: string) => {
  if (!dateStr) return false;
  const d = parseISO(dateStr);
  if (!isValid(d)) return false;
  return isPast(d) && !isToday(d);
};

const isTaskClosed = (statusId: string, statuses: any[]) => {
  if (statusId === 's4') return true;
  const s = statuses.find(st => st.id === statusId);
  return !!s && (s.name.toUpperCase().includes('PRONTO') || s.name.toUpperCase().includes('CONCLU') || s.name.toUpperCase().includes('DONE'));
};

// Omitindo a tipagem estrita do Layout para evitar conflitos com a definição exata do @types
const DEFAULT_LAYOUT: any[] = [
  { i: 'assigned-to-me', x: 0, y: 0, w: 1, h: 4, minW: 1, minH: 3 },
  { i: 'assigned-comments', x: 1, y: 0, w: 1, h: 4, minW: 1, minH: 3 },
  { i: 'my-tasks', x: 0, y: 4, w: 1, h: 3, minW: 1, minH: 3 },
  { i: 'calendar', x: 1, y: 4, w: 1, h: 3, minW: 1, minH: 3 },
];

const TaskDashboard = () => {
  const { tasks, taskStatuses, updateTask } = useAppContext();
  const { profile } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'pending' | 'done' | 'delegated'>('pending');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    overdue: true,
    today: true,
    next: true,
    unscheduled: false
  });
  
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [layout, setLayout] = useLocalStorage<any[]>('clickup-dashboard-layout-v1', DEFAULT_LAYOUT);
  
  // Apenas garantindo que o layout será carregado montado corretamente no grid
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const toggleSection = (sec: string) => {
    setExpandedSections(prev => ({ ...prev, [sec]: !prev[sec] }));
  };

  const { overdue, today, next, unscheduled, closedTasks } = useMemo(() => {
    const activeTasks = tasks.filter(t => !isTaskClosed(t.statusId, taskStatuses));
    const closed = tasks.filter(t => isTaskClosed(t.statusId, taskStatuses));

    const ov: Task[] = [];
    const td: Task[] = [];
    const nx: Task[] = [];
    const un: Task[] = [];

    activeTasks.forEach(task => {
      if (!task.dueDate) {
        un.push(task);
      } else {
        const d = parseISO(task.dueDate);
        if (!isValid(d)) {
          un.push(task);
        } else if (isToday(d)) {
          td.push(task);
        } else if (isPast(d)) {
          ov.push(task);
        } else {
          nx.push(task);
        }
      }
    });

    ov.sort((a,b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
    td.sort((a,b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
    nx.sort((a,b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());

    return { overdue: ov, today: td, next: nx, unscheduled: un, closedTasks: closed };
  }, [tasks, taskStatuses]);

  const recentTasks = useMemo(() => {
    return [...tasks].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()).slice(0, 5);
  }, [tasks]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  }, []);

  const handleLayoutChange = (newLayout: any[]) => {
    setLayout(newLayout);
  };

  const addWidget = (widgetId: string) => {
    setLayout(prev => {
      if (prev.find(p => p.i === widgetId)) return prev;
      return [...prev, { i: widgetId, x: 0, y: Infinity, w: 1, h: 3, minW: 1, minH: 3 }];
    });
  };

  const removeWidget = (widgetId: string) => {
    setLayout(prev => prev.filter(p => p.i !== widgetId));
  };

  const TaskRow = ({ task, isCompact = false }: { task: Task; isCompact?: boolean }) => {
    const prio = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.None;
    const dateStr = formatDate(task.dueDate);
    const overdueFlag = isOverdue(task.dueDate);

    return (
      <div className={`flex items-center group hover:bg-white/[0.03] ${isCompact ? 'py-1.5' : 'py-2'} px-3 cursor-default border-b border-white/[0.03] last:border-0 transition-all`}>
        <div className={`flex-shrink-0 ${isCompact ? 'w-4' : 'w-5'} mr-3 flex items-center justify-center`}>
          <Circle 
            className={`${isCompact ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-gray-600 hover:text-gray-400 cursor-pointer transition-colors`} 
            onClick={() => updateTask(task.id, { statusId: taskStatuses.find(s => isTaskClosed(s.id, taskStatuses))?.id || task.statusId })}
          />
        </div>
        <div className="flex-1 min-w-0 pr-4">
          <p 
            className="text-[13px] font-medium text-gray-300 truncate group-hover:text-white transition-colors cursor-pointer hover:underline underline-offset-2"
            onClick={() => setSelectedTask(task)}
          >
            {task.name}
          </p>
        </div>
        
        <div className="w-[80px] flex-shrink-0 px-2 flex items-center opacity-100">
          {task.priority !== 'None' ? (
            <div className="flex items-center gap-1.5 text-[11px] font-medium" style={{ color: prio.color }}>
              <Flag className="w-3.5 h-3.5" style={{ fill: prio.color, color: prio.color }} />
              {prio.label}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-600 opacity-0 group-hover:opacity-100">
              <Flag className="w-3.5 h-3.5" /> Setar
            </div>
          )}
        </div>

        <div className="w-[90px] flex-shrink-0 px-2 flex items-center justify-end">
          {dateStr ? (
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded flex items-center gap-1 ${overdueFlag ? 'text-red-400' : 'text-gray-400'}`}>
              {overdueFlag && <div className="w-1.5 h-1.5 rounded-full bg-red-400 mr-0.5" />}
              {dateStr}
            </span>
          ) : (
            <span className="text-[11px] text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Setar
            </span>
          )}
        </div>
      </div>
    );
  };

  const Section = ({ title, count, isExpanded, onToggle, tasks, emptyMessage }: any) => {
    return (
      <div className="flex flex-col">
        <div 
          className="flex items-center gap-2 px-2 py-2 hover:bg-white/[0.04] rounded-md cursor-pointer transition-colors group select-none"
          onClick={onToggle}
        >
          <button className="text-gray-500 group-hover:text-gray-300 transition-colors">
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider group-hover:text-gray-200 transition-colors">
            {title === 'Pendente' && <span className="w-3 h-3 border border-gray-400 rounded-full flex items-center justify-center opacity-50" />}
            {title}
          </div>
          <span className="text-xs font-medium text-gray-500">{count}</span>
        </div>

        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              {tasks.length === 0 ? (
                <div className="py-4 px-8 text-xs text-gray-500 font-medium">
                  {emptyMessage || "Nenhuma tarefa."}
                </div>
              ) : (
                <div className="flex flex-col mb-4 pl-4 border-l-2 border-white/5 ml-3 mt-1">
                  <div className="flex items-center py-2 px-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-white/5">
                    <div className="w-5 mr-3" />
                    <div className="flex-1 pr-4">Nome</div>
                    <div className="w-[80px] px-2">Prioridade</div>
                    <div className="w-[90px] px-2 text-right">Data</div>
                  </div>
                  {tasks.map((task: Task) => (
                    <TaskRow key={task.id} task={task} />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const TabButton = ({ active, onClick, children }: any) => (
    <button 
      onClick={onClick}
      className={`text-sm font-semibold pb-2 border-b-2 transition-colors ${
        active ? 'border-primary text-gray-100' : 'border-transparent text-gray-500 hover:text-gray-300'
      }`}
    >
      {children}
    </button>
  );

  const WidgetCard = ({ title, actionIcon, id, children }: any) => (
    <div className="bg-[#1a1a1a] border border-[#2b2b2b] rounded-xl overflow-hidden flex flex-col hover:border-[#3a3a3a] transition-colors h-full w-full group relative">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.02]">
        <div className="flex items-center gap-2">
          {/* Drag Handle */}
          <div className="drag-handle cursor-grab active:cursor-grabbing text-gray-600 hover:text-gray-400 transition-colors p-1 -ml-2">
            <GripVertical className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-gray-200">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          {actionIcon && <div className="text-gray-500 hover:text-gray-300 cursor-pointer">{actionIcon}</div>}
          <button 
            onClick={() => removeWidget(id)}
            className="text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 p-1"
            title="Remover Cartão"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {children}
      </div>
    </div>
  );

  const renderWidget = (id: string) => {
    switch (id) {
      case 'assigned-to-me':
        return (
          <WidgetCard id={id} title={
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-indigo-500/20 text-indigo-400 flex items-center justify-center rounded border border-indigo-500/30">
                <LayoutDashboard className="w-3.5 h-3.5" />
              </div>
              Atribuídas a mim
            </div>
          } actionIcon={<MoreHorizontal className="w-4 h-4" />}>
            <div className="flex flex-col h-full">
              <div className="flex items-center gap-2 px-4 py-2 hover:bg-white/[0.02] cursor-pointer transition-colors border-b border-[#2b2b2b]">
                <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest border border-gray-600 rounded-full px-2">Pendente</span>
                <span className="text-[11px] font-bold text-gray-500">{today.length + overdue.length}</span>
              </div>
              <div className="flex items-center py-2 px-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-[#2b2b2b] bg-[#141414]">
                <div className="flex-1 pr-4">Nome</div>
                <div className="w-[80px] px-2">Prioridade</div>
                <div className="w-[90px] px-2 text-right">Data</div>
              </div>
              <div className="flex-1 p-2 flex flex-col gap-0.5">
                {[...overdue, ...today].map(task => (
                  <TaskRow key={task.id} task={task} isCompact />
                ))}
                {overdue.length === 0 && today.length === 0 && (
                  <div className="py-8 text-center text-xs text-gray-500">Nenhuma tarefa atribuída a você no momento.</div>
                )}
                <div className="px-3 py-2 mt-2">
                  <button className="flex items-center gap-1.5 text-[13px] font-medium text-gray-400 hover:text-white transition-colors">
                    <Plus className="w-3.5 h-3.5" /> Adicionar tarefa
                  </button>
                </div>
              </div>
            </div>
          </WidgetCard>
        );
      case 'assigned-comments':
        return (
          <WidgetCard id={id} title="Comentários atribuídos" actionIcon={<MoreHorizontal className="w-4 h-4" />}>
             <div className="flex flex-col items-center justify-center h-full text-center p-8">
               <Inbox className="w-12 h-12 text-gray-600 mb-4 opacity-50" />
               <p className="text-sm font-medium text-gray-400">Você está em dia com seus comentários!</p>
             </div>
          </WidgetCard>
        );
      case 'my-tasks':
        return (
          <WidgetCard id={id} title="Minhas tarefas" actionIcon={<Settings className="w-4 h-4" />}>
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="w-16 h-16 mb-4 opacity-40 flex items-center justify-center relative">
                <Inbox className="w-12 h-12 text-gray-400" strokeWidth={1} />
                <div className="absolute bottom-2 right-0 bg-[#1a1a1a] rounded-full p-0.5 border-2 border-[#1a1a1a]">
                  <div className="w-3 h-3 bg-gray-600 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-2 h-2 text-white" />
                  </div>
                </div>
              </div>
              <p className="text-xs font-medium text-gray-400 max-w-[200px] mb-6">
                A lista pessoal contém todas as suas tarefas. <span className="text-primary hover:underline cursor-pointer">Saiba mais</span>
              </p>
              <button className="flex items-center gap-1.5 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md text-xs font-semibold text-gray-200 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Criar uma tarefa
              </button>
            </div>
          </WidgetCard>
        );
      case 'calendar':
        return (
          <WidgetCard id={id} title="Agenda" actionIcon={<MoreHorizontal className="w-4 h-4" />}>
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <div className="mb-4 text-gray-500 opacity-60">
                <CalendarDays className="w-12 h-12" strokeWidth={1} />
              </div>
              <p className="text-[11px] font-medium text-gray-400 px-4 mb-6 max-w-[260px]">
                Conecte seu calendário para ver os próximos eventos e entrar na sua próxima chamada
              </p>
              
              <div className="flex flex-col gap-2 w-full max-w-[220px]">
                <button className="flex items-center justify-between px-3 py-2 bg-[#222] hover:bg-[#2a2a2a] border border-[#333] rounded-lg transition-colors w-full group">
                  <div className="flex items-center gap-2 text-[12px] font-semibold text-gray-300 group-hover:text-gray-100 transition-colors">
                    <div className="w-4 h-4 bg-white rounded flex items-center justify-center shadow-sm">
                      <span className="text-blue-500 font-extrabold text-[10px]">G</span>
                    </div>
                    Google Agenda
                  </div>
                  <span className="text-[9px] font-bold text-gray-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-md">Conectar</span>
                </button>

                <button className="flex items-center justify-between px-3 py-2 bg-[#222] hover:bg-[#2a2a2a] border border-[#333] rounded-lg transition-colors w-full group">
                  <div className="flex items-center gap-2 text-[12px] font-semibold text-gray-300 group-hover:text-gray-100 transition-colors">
                    <div className="w-4 h-4 bg-[#0078D4] rounded flex items-center justify-center shadow-sm">
                      <span className="text-white font-extrabold text-[10px]">O</span>
                    </div>
                    Microsoft Outlook
                  </div>
                  <span className="text-[9px] font-bold text-gray-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-md">Conectar</span>
                </button>
              </div>
            </div>
          </WidgetCard>
        );
      case 'priorities':
        return (
          <WidgetCard id={id} title="Prioridades" actionIcon={<Settings className="w-4 h-4" />}>
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="w-14 h-14 mb-4 opacity-40 flex items-center justify-center relative">
                <div className="w-12 h-12 rounded-full border-2 border-gray-400 flex items-center justify-center relative bg-transparent">
                  <div className="absolute -bottom-1 -right-1 bg-[#1a1a1a] rounded-full p-0.5">
                    <CheckCircle2 className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>
              <p className="text-xs font-medium text-gray-400 max-w-[220px] mb-6">
                As Prioridades mantêm as tarefas importantes em uma única lista. <span className="text-primary hover:underline cursor-pointer">Saiba mais</span>
              </p>
              <button className="flex items-center gap-1.5 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md text-xs font-semibold text-gray-200 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Criar uma tarefa
              </button>
            </div>
          </WidgetCard>
        );
      case 'ai-standup':
        return (
          <WidgetCard id={id} title={<div className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-purple-400" /> StandUp da IA</div>}>
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="w-12 h-12 mb-4 relative">
                <div className="w-full h-full bg-gradient-to-tr from-purple-600 via-pink-500 to-yellow-500 rounded-xl animate-pulse opacity-90 flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.3)]">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-[11px] font-medium text-gray-400 max-w-[240px] mb-6 leading-relaxed">
                Use a IA ClickUp para criar resumos recorrentes das atividades recentes.
              </p>
              <button className="flex items-center gap-1.5 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md text-xs font-semibold text-gray-200 transition-colors">
                Criar uma recapitulação
              </button>
            </div>
          </WidgetCard>
        );
      default:
        return <WidgetCard id={id} title="Desconhecido"><div className="p-4">Widget não encontrado.</div></WidgetCard>;
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#111111] overflow-y-auto custom-scrollbar text-white relative">
      {/* Header */}
      <div className="px-8 pt-8 pb-6 flex items-center justify-between">
        <h1 className="text-[26px] font-extrabold text-white tracking-tight">
          {greeting}, {profile?.fullName?.split(' ')[0] || 'Arthur'}
        </h1>
        <button 
          onClick={() => setIsManageModalOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-md text-xs font-semibold text-gray-300 transition-colors"
        >
          <Settings className="w-3.5 h-3.5" /> Gerenciar cartões
        </button>
      </div>

      <div className="flex flex-col lg:flex-row px-8 pb-12 gap-6 w-full h-full">
        {/* Coluna Esquerda: Recentes e Meu Trabalho (Fixa) */}
        <div className="w-full lg:w-[360px] flex-shrink-0 flex flex-col gap-6">
          {/* Recentes */}
          <div className="bg-[#1a1a1a] border border-[#2b2b2b] rounded-xl overflow-hidden hover:border-[#3a3a3a] transition-colors">
            <div className="px-5 py-3 border-b border-white/[0.02]">
              <h2 className="text-sm font-bold text-gray-200">Recentes</h2>
            </div>
            <div className="p-2">
              {recentTasks.map(task => (
                <div key={task.id} 
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/[0.04] rounded-lg cursor-pointer transition-colors group"
                  onClick={() => setSelectedTask(task)}
                >
                  <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-gray-500 group-hover:text-primary transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0 flex items-center text-xs">
                    <span className="font-medium text-gray-300 truncate group-hover:text-white transition-colors">{task.name}</span>
                    <span className="text-gray-600 mx-1.5">•</span>
                    <span className="text-gray-500 truncate">em Clientes</span>
                  </div>
                </div>
              ))}
              {recentTasks.length === 0 && (
                <div className="px-3 py-4 text-xs text-gray-500 text-center">Nenhum item recente.</div>
              )}
            </div>
          </div>

          {/* Meu Trabalho */}
          <div className="bg-[#1a1a1a] border border-[#2b2b2b] rounded-xl overflow-hidden hover:border-[#3a3a3a] transition-colors flex-1 flex flex-col">
            <div className="px-5 py-3 border-b border-white/[0.02]">
              <h2 className="text-sm font-bold text-gray-200">Meu trabalho</h2>
            </div>
            
            {/* Tabs */}
            <div className="flex items-center gap-5 px-5 pt-2 border-b border-[#2b2b2b]">
              <TabButton active={activeTab === 'pending'} onClick={() => setActiveTab('pending')}>Pendente</TabButton>
              <TabButton active={activeTab === 'done'} onClick={() => setActiveTab('done')}>Feito</TabButton>
              <TabButton active={activeTab === 'delegated'} onClick={() => setActiveTab('delegated')}>Delegado</TabButton>
            </div>

            <div className="p-2 flex-1">
              {activeTab === 'pending' && (
                <div className="flex flex-col gap-0.5">
                  <Section 
                    title="Hoje" count={today.length} 
                    isExpanded={expandedSections.today} onToggle={() => toggleSection('today')}
                    emptyMessage="As tarefas e os lembretes atribuídos a você serão exibidos aqui."
                    tasks={today}
                  />
                  <Section 
                    title="Em atraso" count={overdue.length} 
                    isExpanded={expandedSections.overdue} onToggle={() => toggleSection('overdue')}
                    tasks={overdue}
                  />
                  <Section 
                    title="Próximo" count={next.length} 
                    isExpanded={expandedSections.next} onToggle={() => toggleSection('next')}
                    tasks={next}
                  />
                  <Section 
                    title="Não programado" count={unscheduled.length} 
                    isExpanded={expandedSections.unscheduled} onToggle={() => toggleSection('unscheduled')}
                    tasks={unscheduled}
                  />
                </div>
              )}
              {activeTab === 'done' && (
                <div className="py-12 text-center text-[13px] font-medium text-gray-500">
                  {closedTasks.length === 0 ? "Nenhuma tarefa concluída recentemente." : `${closedTasks.length} tarefas concluídas.`}
                </div>
              )}
              {activeTab === 'delegated' && (
                <div className="py-12 text-center text-[13px] font-medium text-gray-500">
                  Nenhuma tarefa delegada.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Coluna Direita: Dashboard Dinâmico (Grid Layout) */}
        <div className="flex-1 min-h-[600px]">
          {mounted && (
            <ResponsiveGridLayout
              className="layout"
              layouts={{ lg: layout, md: layout, sm: layout, xs: layout, xxs: layout }}
              breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
              cols={{ lg: 2, md: 2, sm: 1, xs: 1, xxs: 1 }}
              rowHeight={100}
              margin={[24, 24]}
              onLayoutChange={handleLayoutChange}
              draggableHandle=".drag-handle"
              isResizable={true}
              isDraggable={true}
            >
              {layout.map(item => (
                <div key={item.i} data-grid={item}>
                  {renderWidget(item.i)}
                </div>
              ))}
            </ResponsiveGridLayout>
          )}
          
          {layout.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full border-2 border-dashed border-[#333] rounded-xl text-center p-10 bg-white/[0.01]">
               <LayoutDashboard className="w-12 h-12 text-gray-600 mb-4" />
               <h3 className="text-lg font-bold text-gray-300 mb-2">Seu dashboard está vazio</h3>
               <p className="text-sm text-gray-500 mb-6">Adicione cartões para personalizar seu espaço de trabalho.</p>
               <button 
                 onClick={() => setIsManageModalOpen(true)}
                 className="flex items-center gap-2 px-4 py-2 bg-primary text-white hover:bg-primary/90 rounded-md text-sm font-semibold transition-colors"
               >
                 <Plus className="w-4 h-4" /> Adicionar cartão
               </button>
            </div>
          )}
        </div>
      </div>

      <ManageCardsModal 
        isOpen={isManageModalOpen} 
        onClose={() => setIsManageModalOpen(false)} 
        onAddWidget={addWidget}
        existingWidgets={layout.map(l => l.i)}
      />

      {selectedTask && (
        <TaskModal
          task={selectedTask}
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
};

export default TaskDashboard;
