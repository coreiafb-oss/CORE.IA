import React, { useState, useMemo } from 'react';
import { Home, Inbox, CheckSquare, Clock, MoreHorizontal, Plus, Search, ChevronDown, ChevronRight, Folder as FolderIcon, Users, List } from 'lucide-react';
import { ViewType } from '../types';
import { useAppContext } from '../context/AppContext';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

const Sidebar = ({ currentView, onViewChange }: SidebarProps) => {
  const { tasks, clients } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [space1Open, setSpace1Open] = useState(true);
  const [space2Open, setSpace2Open] = useState(true);

  const taskCount = tasks.length;
  const clientCount = clients.length;

  // Filter nav items by search
  const items = useMemo(() => {
    const allItems = [
      { key: 'overview', label: 'Space', parent: 'space1' },
      { key: 'tasks', label: 'Pão de Queijo KiDelícia', parent: 'space1' },
      { key: 'clients', label: 'Clientes', parent: 'space2' },
    ];
    if (!searchQuery) return allItems;
    return allItems.filter(i => i.label.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery]);

  return (
    <div className="w-[260px] bg-[#0d0d0d] border-r border-[#222] flex flex-col h-full overflow-y-auto flex-shrink-0 custom-scrollbar">
      {/* Workspace Header */}
      <div className="p-4 flex items-center justify-between hover:bg-[#2b2b2b] cursor-pointer transition-colors">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
            A
          </div>
          <span className="font-medium text-sm truncate text-gray-200">Arthur de Moraes's Workspace</span>
          <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
        </div>
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <div className="flex items-center gap-2 bg-white/5 rounded-lg px-2 py-1.5 text-sm text-gray-400 border border-white/5 focus-within:border-primary/30 transition-colors">
          <Search className="w-4 h-4 flex-shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar"
            className="bg-transparent border-none outline-none text-sm text-gray-200 w-full placeholder-gray-500"
          />
          {!searchQuery && (
            <span className="ml-auto text-[10px] font-medium bg-[#1e1e1e] px-1.5 py-0.5 rounded border border-[#333333] flex-shrink-0">Ctrl K</span>
          )}
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-gray-500 hover:text-gray-300 flex-shrink-0">✕</button>
          )}
        </div>
      </div>

      {/* Main Nav */}
      <div className="px-2 py-2 space-y-0.5">
        <NavItem icon={<Home className="w-4 h-4" />} label="Início" onClick={() => onViewChange('overview')} active={currentView === 'overview'} />
        <NavItem
          icon={<CheckSquare className="w-4 h-4" />}
          label="Minhas tarefas"
          badge={taskCount}
          onClick={() => onViewChange('tasks')}
          active={currentView === 'tasks' || currentView === 'board' || currentView === 'calendar'}
        />
      </div>

      {/* Spaces */}
      <div className="mt-4 px-2 flex-1 pb-4">
        <div className="flex items-center justify-between px-2 py-1 text-xs font-semibold text-gray-500 group cursor-pointer hover:text-gray-300 transition-colors">
          <span>Espaços</span>
          <Plus className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <div className="mt-1 space-y-0.5">
          {/* Space 1: Demandas */}
          {(!searchQuery || items.some(i => i.parent === 'space1')) && (
            <div className="mt-2">
              <div
                className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer group transition-colors ${
                  (currentView === 'overview' && !searchQuery) ? 'bg-white/10 text-white' : 'hover:bg-white/5'
                }`}
                onClick={() => setSpace1Open(!space1Open)}
              >
                {space1Open ? (
                  <ChevronDown className="w-3 h-3 text-gray-500" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-gray-500" />
                )}
                <div className="w-5 h-5 rounded bg-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">S</div>
                <span className="text-sm font-medium text-gray-200">Space</span>
                <div className="ml-auto opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                  <MoreHorizontal className="w-3 h-3 text-gray-400 hover:text-white" />
                  <Plus className="w-3 h-3 text-gray-400 hover:text-white" />
                </div>
              </div>
              {space1Open && (
                <div className="ml-6 pl-2 border-l border-[#333333] mt-1 space-y-0.5">
                  {(!searchQuery || items.some(i => i.key === 'overview' || i.label.includes('Clientes Line'))) && (
                    <div className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-[#2b2b2b] cursor-pointer text-gray-400 hover:text-gray-200 transition-colors">
                      <FolderIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium">Clientes Line</span>
                    </div>
                  )}
                  {(!searchQuery || items.some(i => i.key === 'tasks')) && (
                    <div
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors ${
                        currentView === 'tasks' || currentView === 'board' || currentView === 'calendar'
                          ? 'bg-[#2b2b2b] text-gray-200'
                          : 'text-gray-400 hover:bg-[#2b2b2b] hover:text-gray-200'
                      }`}
                      onClick={() => onViewChange('tasks')}
                    >
                      <List className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium">Pão de Queijo Ki...</span>
                      <span className="ml-auto text-[10px] text-gray-500 font-medium">{taskCount}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Space 2: Equipe */}
          {(!searchQuery || items.some(i => i.parent === 'space2')) && (
            <div className="mt-2">
              <div
                className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-[#2b2b2b] cursor-pointer group transition-colors"
                onClick={() => setSpace2Open(!space2Open)}
              >
                {space2Open ? (
                  <ChevronDown className="w-3 h-3 text-gray-500" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-gray-500" />
                )}
                <div className="w-5 h-5 rounded bg-red-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">E</div>
                <span className="text-sm font-medium text-gray-200">Espaço da equipe</span>
              </div>
              {space2Open && (
                <div className="ml-6 pl-2 border-l border-[#333333] mt-1 space-y-0.5">
                  <div className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-[#2b2b2b] cursor-pointer text-gray-400 hover:text-gray-200 transition-colors">
                    <FolderIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium">Projetos</span>
                  </div>
                  {(!searchQuery || items.some(i => i.key === 'clients')) && (
                    <div
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors ${
                        currentView === 'clients' ? 'bg-[#2b2b2b] text-gray-200' : 'text-gray-400 hover:bg-[#2b2b2b] hover:text-gray-200'
                      }`}
                      onClick={() => onViewChange('clients')}
                    >
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium">Clientes</span>
                      <span className="ml-auto text-[10px] text-gray-500 font-medium">{clientCount}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const NavItem = ({ icon, label, active, badge, onClick }: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  badge?: number;
  onClick?: () => void;
}) => (
  <div
    onClick={onClick}
    className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors ${
      active ? 'bg-[#2b2b2b] text-white' : 'text-gray-400 hover:bg-[#2b2b2b] hover:text-gray-200'
    }`}
  >
    {icon}
    <span className="text-sm font-medium">{label}</span>
    {badge !== undefined && badge > 0 && (
      <span className="ml-auto text-[10px] text-gray-500 bg-[#2b2b2b] px-1.5 py-0.5 rounded-full font-medium">{badge}</span>
    )}
  </div>
);

export default Sidebar;
