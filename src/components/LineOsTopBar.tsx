import React, { useState } from 'react';
import { Search, Bell, Plus, LayoutDashboard, CheckSquare, Users, DollarSign, GraduationCap, Calendar, ChevronRight, FileText, Settings, LogOut, Layers, Zap, Command } from 'lucide-react';
import { LineOsTab } from './LineOsSidebar';
import { motion, AnimatePresence } from 'motion/react';

const moduleLabels: Record<LineOsTab, { label: string; icon: React.ElementType }> = {
  dashboard:   { label: 'Dashboard',              icon: LayoutDashboard },
  gestor:      { label: 'Gestor de Tarefas',      icon: Layers },
  aprovacao:   { label: 'Aprovação de Conteúdo',  icon: CheckSquare },
  crm:         { label: 'CRM & Vendas',           icon: Users },
  financeiro:  { label: 'Financeiro & DRE',       icon: DollarSign },
  academy:     { label: 'LINE Academy',            icon: GraduationCap },
  agendamento: { label: 'Agendamento',             icon: Calendar },
};

interface Props {
  activeTab: LineOsTab;
  onOpenPalette: () => void;
}

const LineOsTopBar = ({ activeTab, onOpenPalette }: Props) => {
  const { label, icon: ActiveIcon } = moduleLabels[activeTab];
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const closeAll = () => {
    setShowNotifications(false);
    setShowUserMenu(false);
  };

  return (
    <>
      {(showNotifications || showUserMenu) && (
        <div className="fixed inset-0 z-[45]" onClick={closeAll} />
      )}

      <header
        className="h-12 flex items-center justify-between px-5 flex-shrink-0 z-[50] gap-4 relative"
        style={{ 
          background: 'var(--surface-1)', 
          borderBottom: '1px solid var(--border-subtle)' 
        }}
      >
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-[13px] min-w-0">
          <span className="text-zinc-600 font-medium flex-shrink-0">LINE OS</span>
          <ChevronRight className="w-3 h-3 text-zinc-700 flex-shrink-0" />
          <div className="flex items-center gap-1.5 text-zinc-200 font-medium min-w-0">
            <ActiveIcon className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" strokeWidth={1.75} />
            <span className="truncate">{label}</span>
          </div>
        </div>

        {/* Search trigger */}
        <button
          onClick={onOpenPalette}
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-[13px] text-zinc-500 transition-all duration-150 w-60 flex-shrink-0 hover:text-zinc-400"
          style={{ 
            background: 'var(--surface-2)', 
            border: '1px solid var(--border-subtle)' 
          }}
        >
          <Search className="w-3.5 h-3.5 flex-shrink-0 text-zinc-600" />
          <span className="flex-1 text-left text-xs">Buscar...</span>
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <kbd className="text-[10px] font-medium px-1.5 py-0.5 rounded text-zinc-500" style={{ background: 'var(--surface-0)', border: '1px solid var(--border-subtle)' }}>⌘</kbd>
            <kbd className="text-[10px] font-medium px-1.5 py-0.5 rounded text-zinc-500" style={{ background: 'var(--surface-0)', border: '1px solid var(--border-subtle)' }}>K</kbd>
          </div>
        </button>

        {/* Right actions */}
        <div className="flex items-center gap-1 flex-shrink-0 relative">

          {/* Notifications */}
          <div className="relative">
            <button 
              onClick={() => { closeAll(); setShowNotifications(!showNotifications); }}
              className={`w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-300 transition-all duration-150 relative ${showNotifications ? 'bg-white/[0.06] text-zinc-200' : 'hover:bg-white/[0.04]'}`}
            >
              <Bell className="w-4 h-4" strokeWidth={1.75} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
            </button>
            <AnimatePresence>
              {showNotifications && (
                <motion.div 
                  initial={{ opacity: 0, y: 6, scale: 0.97 }} 
                  animate={{ opacity: 1, y: 0, scale: 1 }} 
                  exit={{ opacity: 0, y: 6, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-80 rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50"
                  style={{ background: 'var(--surface-3)', border: '1px solid var(--border-default)' }}
                >
                  <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <h3 className="text-[13px] font-semibold text-white">Notificações</h3>
                    <span className="text-[10px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full font-medium">1 nova</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto custom-scrollbar">
                    <div className="p-3 hover:bg-white/[0.03] transition-colors cursor-pointer flex gap-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Calendar className="w-4 h-4 text-red-400" />
                      </div>
                      <div>
                        <p className="text-[13px] text-zinc-200 font-medium mb-0.5">Reunião em 10 min</p>
                        <p className="text-xs text-zinc-500">Call de Kickoff com Cliente Novo.</p>
                        <p className="text-[10px] text-zinc-600 mt-1">Agora</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    <button className="w-full py-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors" onClick={closeAll}>Marcar como lidas</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="w-px h-5 mx-1" style={{ background: 'var(--border-subtle)' }} />

          {/* User */}
          <div className="relative">
            <div 
              onClick={() => { closeAll(); setShowUserMenu(!showUserMenu); }}
              className={`flex items-center gap-2 cursor-pointer px-2 py-1 rounded-lg transition-all duration-150 ${showUserMenu ? 'bg-white/[0.06]' : 'hover:bg-white/[0.04]'}`}
            >
              <div className="w-7 h-7 rounded-lg bg-[var(--color-primary)] flex items-center justify-center text-white font-semibold text-xs shadow-sm drop-shadow-md">
                A
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-[12px] font-medium text-zinc-300 leading-tight">Arthur</span>
                <span className="text-[10px] font-medium text-zinc-600 leading-tight">Admin</span>
              </div>
            </div>
            <AnimatePresence>
              {showUserMenu && (
                <motion.div 
                  initial={{ opacity: 0, y: 6, scale: 0.97 }} 
                  animate={{ opacity: 1, y: 0, scale: 1 }} 
                  exit={{ opacity: 0, y: 6, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-56 rounded-xl shadow-2xl shadow-black/50 py-1 z-50"
                  style={{ background: 'var(--surface-3)', border: '1px solid var(--border-default)' }}
                >
                  <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <p className="text-[13px] font-semibold text-white">Arthur de Moraes</p>
                    <p className="text-xs text-zinc-500">admin@lineos.com</p>
                  </div>
                  <div className="py-1">
                    <button onClick={closeAll} className="w-full text-left px-4 py-2 text-[13px] text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200 flex items-center gap-2 transition-colors">
                      <Settings className="w-4 h-4" strokeWidth={1.75} /> Configurações
                    </button>
                  </div>
                  <div style={{ borderTop: '1px solid var(--border-subtle)' }} className="py-1">
                    <button onClick={closeAll} className="w-full text-left px-4 py-2 text-[13px] text-red-400 hover:bg-red-500/5 flex items-center gap-2 transition-colors">
                      <LogOut className="w-4 h-4" strokeWidth={1.75} /> Sair
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>
    </>
  );
};

export default LineOsTopBar;
