import React from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  Users,
  DollarSign,
  GraduationCap,
  Calendar,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import useLocalStorage from '../hooks/useLocalStorage';
import LineLogo from './LineLogo';

export type LineOsTab =
  | 'dashboard'
  | 'gestor'
  | 'aprovacao'
  | 'crm'
  | 'financeiro'
  | 'academy'
  | 'agendamento';

interface Props {
  activeTab: LineOsTab;
  setActiveTab: (tab: LineOsTab) => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'main' },
  { id: 'gestor', label: 'Tarefas', icon: Layers, section: 'main' },
  { id: 'crm', label: 'CRM', icon: Users, section: 'main' },
  { id: 'financeiro', label: 'Financeiro', icon: DollarSign, section: 'main' },
  { id: 'aprovacao', label: 'Conteúdos', icon: CheckSquare, section: 'tools' },
  { id: 'agendamento', label: 'Agenda', icon: Calendar, section: 'tools' },
  { id: 'academy', label: 'Academy', icon: GraduationCap, section: 'tools' },
] as const;

const LineOsSidebar = ({ activeTab, setActiveTab }: Props) => {
  const [isExpanded, setIsExpanded] = useLocalStorage('lineos-sidebar-expanded', true);

  const mainItems = navItems.filter(i => i.section === 'main');
  const toolItems = navItems.filter(i => i.section === 'tools');

  return (
    <motion.aside
      animate={{ width: isExpanded ? 220 : 64 }}
      transition={{ type: 'spring', stiffness: 500, damping: 40 }}
      className="relative flex flex-col h-full flex-shrink-0 z-50 overflow-hidden select-none"
      style={{ background: 'var(--surface-1)', borderRight: '1px solid var(--border-subtle)' }}
    >
      <div className="flex items-center h-14 px-4 gap-2 flex-shrink-0 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <AnimatePresence>
          {isExpanded ? (
            <motion.div
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.15 }}
              className="flex items-center justify-between flex-1 min-w-0"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="flex items-center">
                  <span className="font-heading text-xl font-medium tracking-wide text-white">Line</span>
                  <LineLogo className="w-5 h-5 ml-1 text-[var(--color-primary)]" />
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="relative flex-shrink-0 flex items-center justify-center w-full">
              <LineLogo className="w-7 h-7 text-[var(--color-primary)] drop-shadow-md" />
            </div>
          )}
        </AnimatePresence>
      </div>


      {/* ─── Navigation ──────────────────────────── */}
      <div className="flex-1 flex flex-col py-3 px-2 overflow-y-auto no-scrollbar">
        {/* Main section */}
        {isExpanded && (
          <div className="px-2 mb-1.5">
            <span className="font-heading text-[10px] font-bold uppercase tracking-[0.08em] text-zinc-500">Módulos</span>
          </div>
        )}
        <div className="flex flex-col gap-0.5">
          {mainItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as LineOsTab)}
                title={!isExpanded ? item.label : undefined}
                className={`relative flex items-center gap-2.5 h-9 rounded-lg transition-all duration-150 group
                  ${isExpanded ? 'px-2.5' : 'justify-center px-0'}
                  ${isActive
                    ? 'bg-white/[0.08] text-white'
                    : 'text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300'
                  }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-indicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-[var(--color-primary)]"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <Icon
                  className={`w-[17px] h-[17px] flex-shrink-0 transition-colors duration-150 ${
                    isActive ? 'text-red-400' : ''
                  }`}
                  strokeWidth={isActive ? 2 : 1.75}
                />
                <AnimatePresence>
                  {isExpanded && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-[13px] font-medium truncate leading-none"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            );
          })}
        </div>

        {/* Separator */}
        <div className="my-3 mx-2 h-px" style={{ background: 'var(--border-subtle)' }} />

        {/* Tools section */}
        {isExpanded && (
          <div className="px-2 mb-1.5">
            <span className="font-heading text-[10px] font-bold uppercase tracking-[0.08em] text-zinc-500">Ferramentas</span>
          </div>
        )}
        <div className="flex flex-col gap-0.5">
          {toolItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as LineOsTab)}
                title={!isExpanded ? item.label : undefined}
                className={`relative flex items-center gap-2.5 h-9 rounded-lg transition-all duration-150 group
                  ${isExpanded ? 'px-2.5' : 'justify-center px-0'}
                  ${isActive
                    ? 'bg-white/[0.08] text-white'
                    : 'text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300'
                  }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-indicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-red-500"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <Icon
                  className={`w-[17px] h-[17px] flex-shrink-0 transition-colors duration-150 ${
                    isActive ? 'text-red-400' : ''
                  }`}
                  strokeWidth={isActive ? 2 : 1.75}
                />
                <AnimatePresence>
                  {isExpanded && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-[13px] font-medium truncate leading-none"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Bottom ──────────────────────────────── */}
      <div className="flex flex-col gap-0.5 px-2 pb-3 border-t pt-3" style={{ borderColor: 'var(--border-subtle)' }}>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`flex items-center gap-2.5 h-9 rounded-lg text-zinc-600 hover:bg-white/[0.04] hover:text-zinc-400 transition-all duration-150
            ${isExpanded ? 'px-2.5' : 'justify-center'}`}
        >
          {isExpanded ? <ChevronLeft className="w-4 h-4 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 flex-shrink-0" />}
          <AnimatePresence>
            {isExpanded && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[13px] font-medium">
                Recolher
              </motion.span>
            )}
          </AnimatePresence>
        </button>
        <button
          title="Configurações"
          className={`flex items-center gap-2.5 h-9 rounded-lg text-zinc-600 hover:bg-white/[0.04] hover:text-zinc-400 transition-all duration-150
            ${isExpanded ? 'px-2.5' : 'justify-center'}`}
        >
          <Settings className="w-[17px] h-[17px] flex-shrink-0" strokeWidth={1.75} />
          <AnimatePresence>
            {isExpanded && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[13px] font-medium">
                Configurações
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );
};

export default LineOsSidebar;
