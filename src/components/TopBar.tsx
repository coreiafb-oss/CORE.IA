import React, { useState, useRef, useEffect } from 'react';
import { List, LayoutGrid, Calendar, Plus, Filter, Users, Search, Settings, Share2, Sparkles, Zap, Phone, ChevronDown, AlignLeft, Table, CheckCircle2, X } from 'lucide-react';
import { ViewType } from '../types';
import { AnimatePresence, motion } from 'motion/react';
import { useToast } from './Toast';

interface TopBarProps {
  currentView: ViewType;
  onOpenSettings: () => void;
  onViewChange: (view: ViewType) => void;
  onAddItem: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterPriority: string | null;
  onFilterChange: (priority: string | null) => void;
}

const TopBar = ({
  currentView,
  onOpenSettings,
  onViewChange,
  onAddItem,
  searchQuery,
  onSearchChange,
  filterPriority,
  onFilterChange,
}: TopBarProps) => {
  const { showToast, ToastContainer } = useToast();
  const [showSearch, setShowSearch] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  
  // Client-specific dropdowns
  const [showGroupMenu, setShowGroupMenu] = useState(false);
  const [showColumnsMenu, setShowColumnsMenu] = useState(false);
  const [showSubtasksMenu, setShowSubtasksMenu] = useState(false);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const groupRef = useRef<HTMLDivElement>(null);
  const columnsRef = useRef<HTMLDivElement>(null);
  const subtasksRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setShowFilter(false);
      if (groupRef.current && !groupRef.current.contains(e.target as Node)) setShowGroupMenu(false);
      if (columnsRef.current && !columnsRef.current.contains(e.target as Node)) setShowColumnsMenu(false);
      if (subtasksRef.current && !subtasksRef.current.contains(e.target as Node)) setShowSubtasksMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const priorities = [
    { value: 'Urgent', label: 'Urgente', color: '#ef4444' },
    { value: 'High', label: 'Alta', color: '#eab308' },
    { value: 'Normal', label: 'Normal', color: '#3b82f6' },
    { value: 'Low', label: 'Baixa', color: '#9ca3af' },
    { value: 'None', label: 'Nenhuma', color: '#6b7280' },
  ];

  const columns = ['Faturamento', 'Segmento', 'Repositório', 'Reunião'];

  return (
    <div className="flex flex-col border-b border-[#2b2b2b] bg-[#141414] flex-shrink-0">
      {/* Breadcrumbs & Actions */}
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-2 text-sm">
          {currentView === 'overview' && (
            <>
              <span className="text-gray-400 hover:underline cursor-pointer">Space</span>
              <ChevronDown className="w-3 h-3 text-gray-500 ml-1 cursor-pointer" />
            </>
          )}
          {(currentView === 'tasks' || currentView === 'board' || currentView === 'calendar') && (
            <>
              <span className="text-gray-400 hover:underline cursor-pointer" onClick={() => onViewChange('overview')}>Demandas dos clientes</span>
              <span className="text-gray-600">/</span>
              <span className="text-gray-400 hover:underline cursor-pointer flex items-center gap-1.5">
                <span className="w-4 h-4 rounded bg-[#3a2a2a] flex items-center justify-center text-[10px]">💼</span>
                Clientes Line
              </span>
              <span className="text-gray-600">/</span>
              <span className="font-semibold text-gray-200 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded bg-[#2a2a2a] flex items-center justify-center text-[10px]">📝</span>
                Pão de Queijo KiDelícia
              </span>
              <ChevronDown className="w-3 h-3 text-gray-500 ml-1 cursor-pointer" />
            </>
          )}
          {(currentView === 'clients' || currentView === 'client-board' || currentView === 'client-database') && (
            <>
              <span className="text-gray-400 hover:underline cursor-pointer flex items-center gap-1.5" onClick={() => onViewChange('overview')}>
                <span className="w-4 h-4 rounded bg-[#3a2a2a] flex items-center justify-center text-[10px] text-red-500">E</span>
                Espaço da equipe
              </span>
              <span className="text-gray-600">/</span>
              <span className="font-semibold text-gray-200 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-gray-400" />
                Clientes
              </span>
              <ChevronDown className="w-3 h-3 text-gray-500 ml-1 cursor-pointer" />
            </>
          )}
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-1 hover:text-gray-200 cursor-pointer transition-colors" onClick={() => showToast('Iniciando chamada...')}>
            <Phone className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-1 hover:text-gray-200 cursor-pointer transition-colors" onClick={() => showToast('Gerenciando Agentes')}>
            <Users className="w-4 h-4" />
            <span>Agentes</span>
          </div>
          {(currentView === 'tasks' || currentView === 'board' || currentView === 'calendar') && (
            <div className="flex items-center gap-1 hover:text-gray-200 cursor-pointer transition-colors" onClick={() => showToast('Exibindo automações...')}>
              <Zap className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span>3</span>
            </div>
          )}
          {(currentView === 'clients' || currentView === 'client-board' || currentView === 'client-database') && (
            <div className="flex items-center gap-1 hover:text-gray-200 cursor-pointer transition-colors" onClick={() => showToast('Exibindo automações do cliente...')}>
              <Zap className="w-4 h-4 text-primary fill-primary" />
              <span>2</span>
            </div>
          )}
          <div className="flex items-center gap-1 hover:text-gray-200 cursor-pointer transition-colors" onClick={() => showToast('Abrindo LINE IA...')}>
            <Sparkles className="w-4 h-4 text-primary" />
            <span>Pergunte à IA</span>
          </div>
          <div className="flex items-center gap-1 hover:text-gray-200 cursor-pointer transition-colors" onClick={() => showToast('Link de compartilhamento copiado!')}>
            <Share2 className="w-4 h-4" />
            <span>Compartilhar</span>
          </div>
        </div>
      </div>

      {/* Views Tabs */}
      <div className="flex items-center px-6 gap-1 border-b border-[#2b2b2b]">
        <div className="w-px h-4 bg-[#333333] mx-1" />

        {currentView === 'overview' && (
          <>
            <Tab icon={<AlignLeft className="w-4 h-4" />} label="Overview" active onClick={() => onViewChange('overview')} />
            <Tab icon={<List className="w-4 h-4" />} label="Lista" onClick={() => onViewChange('tasks')} />
            <Tab icon={<LayoutGrid className="w-4 h-4" />} label="Quadro" onClick={() => onViewChange('board')} />
          </>
        )}

        {currentView === 'tasks' && (
          <>
            <Tab icon={<List className="w-4 h-4" />} label="Lista" active onClick={() => onViewChange('tasks')} />
            <Tab icon={<LayoutGrid className="w-4 h-4" />} label="Quadro" onClick={() => onViewChange('board')} />
            <Tab icon={<Calendar className="w-4 h-4" />} label="Calendário" onClick={() => onViewChange('calendar')} />
          </>
        )}

        {currentView === 'board' && (
          <>
            <Tab icon={<List className="w-4 h-4" />} label="Lista" onClick={() => onViewChange('tasks')} />
            <Tab icon={<LayoutGrid className="w-4 h-4" />} label="Quadro" active onClick={() => onViewChange('board')} />
            <Tab icon={<Calendar className="w-4 h-4" />} label="Calendário" onClick={() => onViewChange('calendar')} />
          </>
        )}

        {currentView === 'calendar' && (
          <>
            <Tab icon={<List className="w-4 h-4" />} label="Lista" onClick={() => onViewChange('tasks')} />
            <Tab icon={<LayoutGrid className="w-4 h-4" />} label="Quadro" onClick={() => onViewChange('board')} />
            <Tab icon={<Calendar className="w-4 h-4" />} label="Calendário" active onClick={() => onViewChange('calendar')} />
          </>
        )}

        {(currentView === 'clients' || currentView === 'client-board' || currentView === 'client-database') && (
          <>
            <Tab icon={<List className="w-4 h-4" />} label="Client List" active={currentView === 'clients'} onClick={() => onViewChange('clients')} />
            <Tab icon={<LayoutGrid className={`w-4 h-4 ${currentView !== 'client-board' ? 'text-blue-500' : ''}`} />} label="Client Pipeline" active={currentView === 'client-board'} onClick={() => onViewChange('client-board')} />
            <Tab icon={<Table className={`w-4 h-4 ${currentView !== 'client-database' ? 'text-green-500' : ''}`} />} label="Client Database" active={currentView === 'client-database'} onClick={() => onViewChange('client-database')} />
          </>
        )}

        <div className="flex items-center gap-1 px-3 py-2 text-sm text-gray-400 hover:bg-[#2b2b2b] rounded-t-md cursor-pointer transition-colors" onClick={() => showToast('Nova visualização em breve')}>
          <Plus className="w-4 h-4" />
          <span>Visualização</span>
        </div>
      </div>

      {/* Sub-bar (Filters, Search, etc.) */}
      {currentView !== 'overview' && (
        <div className="flex items-center justify-between px-6 py-2">
          <div className="flex items-center gap-2">
            
            {/* Group Menu */}
            <div className="relative" ref={groupRef}>
              <button 
                onClick={() => setShowGroupMenu(!showGroupMenu)}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-[#2b2b2b] hover:bg-[#333333] rounded text-gray-300 transition-colors border border-transparent hover:border-[#444]"
              >
                <Filter className="w-3 h-3" />
                {currentView === 'clients' || currentView === 'client-board' || currentView === 'client-database' ? 'Grupo: Status' : 'Status'}
              </button>
              <AnimatePresence>
                {showGroupMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute left-0 top-full mt-1 bg-[#1e1e1e] border border-[#333] rounded-lg shadow-2xl z-50 w-40 py-1"
                  >
                    <div className="px-3 py-1.5 text-[10px] text-gray-500 font-bold uppercase tracking-wider">Agrupar por</div>
                    <button className="w-full text-left px-3 py-1.5 text-xs text-white bg-white/10" onClick={() => setShowGroupMenu(false)}>Status</button>
                    <button className="w-full text-left px-3 py-1.5 text-xs text-gray-400 hover:bg-white/5 hover:text-white" onClick={() => { setShowGroupMenu(false); showToast('Agrupamento alternativo em breve');}}>Responsável</button>
                    <button className="w-full text-left px-3 py-1.5 text-xs text-gray-400 hover:bg-white/5 hover:text-white" onClick={() => { setShowGroupMenu(false); showToast('Agrupamento alternativo em breve');}}>Nenhum</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Subtasks Menu */}
            <div className="relative" ref={subtasksRef}>
              <button 
                onClick={() => setShowSubtasksMenu(!showSubtasksMenu)}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-[#2b2b2b] hover:bg-[#333333] rounded text-gray-300 transition-colors border border-transparent hover:border-[#444]"
              >
                <List className="w-3 h-3" />
                {currentView === 'clients' || currentView === 'client-board' || currentView === 'client-database' ? 'Subtarefas' : 'Expandidas'}
              </button>
              <AnimatePresence>
                {showSubtasksMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute left-0 top-full mt-1 bg-[#1e1e1e] border border-[#333] rounded-lg shadow-2xl z-50 w-40 py-1"
                  >
                    <button className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-400 hover:bg-white/5 hover:text-white" onClick={() => { setShowSubtasksMenu(false); showToast('Expandindo dependências...'); }}>
                      Mostrando apenas nível 1
                    </button>
                    <button className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-white bg-white/10" onClick={() => setShowSubtasksMenu(false)}>
                      Expandir todas
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Columns Menu */}
            {(currentView === 'clients' || currentView === 'client-database') && (
              <div className="relative" ref={columnsRef}>
                <button 
                  onClick={() => setShowColumnsMenu(!showColumnsMenu)}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-[#2b2b2b] hover:bg-[#333333] rounded text-gray-300 transition-colors border border-transparent hover:border-[#444]"
                >
                  <Table className="w-3 h-3" />
                  Colunas
                </button>
                <AnimatePresence>
                  {showColumnsMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="absolute left-0 top-full mt-1 bg-[#1e1e1e] border border-[#333] rounded-lg shadow-2xl z-50 w-48 py-1"
                    >
                      <div className="px-3 py-1.5 text-[10px] text-gray-500 font-bold uppercase tracking-wider">Colunas Visíveis</div>
                      {columns.map(col => (
                        <button key={col} className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-white bg-white/5 hover:bg-white/10" onClick={() => showToast(`Alternando coluna ${col}`)}>
                          <span>{col}</span>
                          <CheckCircle2 className="w-3 h-3 text-primary" />
                        </button>
                      ))}
                      <div className="border-t border-[#333] mt-1" />
                      <button className="w-full text-left px-3 py-2 text-xs text-primary hover:bg-white/5" onClick={() => showToast('+ Nova coluna em breve')}>+ Nova coluna</button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Priority Filter */}
            {(currentView === 'tasks' || currentView === 'board' || currentView === 'calendar') && (
              <div className="relative" ref={filterRef}>
                <button
                  onClick={() => setShowFilter(!showFilter)}
                  className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded transition-colors ${
                    filterPriority
                      ? 'text-primary bg-primary/10 border border-primary/20'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                  }`}
                >
                  <Filter className="w-3 h-3" />
                  {filterPriority ? `Filtro: ${priorities.find(p => p.value === filterPriority)?.label}` : 'Filtro'}
                  {filterPriority && (
                    <X
                      className="w-3 h-3 ml-1 hover:text-red-400"
                      onClick={(e) => { e.stopPropagation(); onFilterChange(null); }}
                    />
                  )}
                </button>
                <AnimatePresence>
                  {showFilter && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="absolute right-0 top-full mt-1 bg-[#1e1e1e] border border-[#333] rounded-lg shadow-2xl z-50 w-40 py-1"
                    >
                      <div className="px-3 py-1.5 text-[10px] text-gray-500 font-bold uppercase tracking-wider">Prioridade</div>
                      {priorities.map(p => (
                        <button
                          key={p.value}
                          className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors ${
                            filterPriority === p.value ? 'text-white bg-white/10' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                          }`}
                          onClick={() => { onFilterChange(filterPriority === p.value ? null : p.value); setShowFilter(false); }}
                        >
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                          {p.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {(currentView === 'clients' || currentView === 'client-board' || currentView === 'client-database') && (
              <>
                <div className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-200 cursor-pointer" onClick={() => showToast('Filtrando por fechados')}>
                  <CheckCircle2 className="w-3 h-3 text-primary" /> Fechado
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-200 cursor-pointer" onClick={() => showToast('Filtrando por responsável')}>
                  <Users className="w-3 h-3" /> Responsável
                  <div className="w-4 h-4 rounded-full bg-gray-600 text-white flex items-center justify-center text-[10px]">A</div>
                </div>
              </>
            )}

            {/* Search Toggle */}
            <div className="relative">
              {showSearch ? (
                <div className="flex items-center gap-1 bg-[#1e1e1e] border border-[#444] rounded-lg px-2 py-1">
                  <Search className="w-3.5 h-3.5 text-gray-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Buscar..."
                    className="bg-transparent border-none outline-none text-xs text-white w-32 placeholder-gray-600"
                  />
                  {searchQuery && (
                    <button onClick={() => { onSearchChange(''); }} className="text-gray-500 hover:text-gray-300">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                  <button onClick={() => { setShowSearch(false); onSearchChange(''); }} className="text-gray-500 hover:text-gray-300 ml-1">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <Search
                  className="w-4 h-4 text-gray-400 hover:text-gray-200 cursor-pointer transition-colors"
                  onClick={() => setShowSearch(true)}
                />
              )}
            </div>

            {(currentView === 'clients' || currentView === 'client-board' || currentView === 'client-database') && (
              <button onClick={onOpenSettings} className="flex items-center gap-1 text-xs text-gray-300 hover:text-white border border-[#444] px-2 py-1 rounded">
                <Settings className="w-3 h-3" /> Personalizar
              </button>
            )}

            <div className="flex items-center">
              <button
                onClick={onAddItem}
                className="bg-primary hover:bg-primary text-white text-xs font-medium px-3 py-1.5 rounded-l flex items-center gap-1 transition-colors border-r border-primary"
              >
                {(currentView === 'clients' || currentView === 'client-board' || currentView === 'client-database') ? 'Add Client' : (
                  <>
                    <Plus className="w-3 h-3" /> Tarefa
                  </>
                )}
              </button>
              <button className="bg-primary hover:bg-primary text-white px-1.5 py-1.5 rounded-r transition-colors" onClick={(e) => { e.stopPropagation(); showToast('Ações avançadas de criação')}}>
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}
      <ToastContainer />
    </div>
  );
};

const Tab = ({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }) => (
  <div
    onClick={onClick}
    className={`flex items-center gap-1.5 px-3 py-2 text-sm cursor-pointer border-b-2 ${
      active ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:bg-[#2b2b2b] hover:text-gray-200'
    } rounded-t-md transition-all`}
  >
    {icon}
    <span className="font-medium">{label}</span>
  </div>
);

export default TopBar;
