import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Search, Sparkles, LayoutDashboard, ListTodo, Calendar, AlertCircle, MessageSquare } from 'lucide-react';
import useEscapeKey from '../../hooks/useEscapeKey';

export interface WidgetOption {
  id: string;
  name: string;
  description: string;
  category: string;
  color: string;
  icon: React.ReactNode;
}

export const AVAILABLE_WIDGETS: WidgetOption[] = [
  { 
    id: 'ai-standup', name: 'IA Brain', 
    description: 'Gere ideias e conteúdo com um prompt personalizado', 
    category: 'AI Cards', color: 'from-purple-600 to-pink-500', 
    icon: <Sparkles className="w-5 h-5 text-white" /> 
  },
  { 
    id: 'assigned-to-me', name: 'Atribuídas a mim', 
    description: 'Crie uma visualização de lista usando tarefas atribuídas a você', 
    category: 'Featured', color: 'from-blue-600 to-indigo-600', 
    icon: <ListTodo className="w-5 h-5 text-white" /> 
  },
  { 
    id: 'my-tasks', name: 'Minhas tarefas', 
    description: 'A lista pessoal contém todas as suas tarefas.', 
    category: 'Featured', color: 'from-emerald-500 to-teal-500', 
    icon: <LayoutDashboard className="w-5 h-5 text-white" /> 
  },
  { 
    id: 'calendar', name: 'Agenda', 
    description: 'Conecte seu calendário para ver os próximos eventos.', 
    category: 'Overview', color: 'from-orange-500 to-red-500', 
    icon: <Calendar className="w-5 h-5 text-white" /> 
  },
  { 
    id: 'priorities', name: 'Prioridades', 
    description: 'As Prioridades mantêm as tarefas importantes em uma única lista.', 
    category: 'Priorities', color: 'from-yellow-500 to-orange-500', 
    icon: <AlertCircle className="w-5 h-5 text-white" /> 
  },
  { 
    id: 'assigned-comments', name: 'Comentários atribuídos', 
    description: 'Comentários onde você foi mencionado ou atribuído.', 
    category: 'Featured', color: 'from-cyan-500 to-blue-500', 
    icon: <MessageSquare className="w-5 h-5 text-white" /> 
  },
];

const CATEGORIES = [
  'Featured', 'Overview', 'AI Cards', 'Custom', 'Sprints', 
  'Statuses', 'Tags', 'Assignees', 'Priorities', 'Time Tracking', 
  'Tables', 'Embeds and Apps'
];

interface ManageCardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddWidget: (widgetId: string) => void;
  existingWidgets: string[];
}

export const ManageCardsModal: React.FC<ManageCardsModalProps> = ({ isOpen, onClose, onAddWidget, existingWidgets }) => {
  useEscapeKey(onClose, isOpen);
  const [activeCategory, setActiveCategory] = useState('Featured');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const filteredWidgets = AVAILABLE_WIDGETS.filter(w => {
    if (searchQuery) {
      return w.name.toLowerCase().includes(searchQuery.toLowerCase()) || w.description.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return w.category === activeCategory || activeCategory === 'Featured'; // Featured shows a mix, let's say all for now or just the Featured ones. We will just filter by category if not searching. Actually Featured shows specific ones, but let's just use exact match.
  }).filter(w => !searchQuery ? (activeCategory === 'Featured' ? w.category === 'Featured' || w.category === 'AI Cards' : w.category === activeCategory) : true);

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-[1100px] h-[85vh] bg-[#1a1a1a] border border-[#333] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-[#2b2b2b] bg-[#141414]">
          <h2 className="text-lg font-bold text-gray-100">Adicionar cartão</h2>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-[#222] border border-[#333] rounded-md pl-9 pr-4 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-[#555] w-64"
              />
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white bg-[#1e1e1e] hover:bg-[#2b2b2b] rounded-lg transition-colors border border-[#333]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-[240px] border-r border-[#2b2b2b] bg-[#111] overflow-y-auto custom-scrollbar p-3">
            <div className="space-y-0.5">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                    activeCategory === cat && !searchQuery
                      ? 'bg-white/10 text-white font-medium'
                      : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                  }`}
                >
                  {cat === 'Featured' && <Sparkles className="w-3.5 h-3.5 mr-2.5 opacity-70" />}
                  {cat === 'Overview' && <LayoutDashboard className="w-3.5 h-3.5 mr-2.5 opacity-70" />}
                  {cat === 'AI Cards' && <Sparkles className="w-3.5 h-3.5 mr-2.5 opacity-70 text-purple-400" />}
                  {/* default icon if not matched above */}
                  {['Featured', 'Overview', 'AI Cards'].indexOf(cat) === -1 && <div className="w-3.5 h-3.5 mr-2.5 opacity-50 bg-gray-600 rounded-sm" />}
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 bg-[#1a1a1a] p-8 overflow-y-auto custom-scrollbar">
            <h3 className="text-xl font-bold text-white mb-6">
              {searchQuery ? 'Search Results' : activeCategory}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredWidgets.map(widget => {
                const isAdded = existingWidgets.includes(widget.id);
                
                return (
                  <div 
                    key={widget.id}
                    onClick={() => !isAdded && onAddWidget(widget.id)}
                    className={`bg-[#222] border rounded-xl overflow-hidden flex flex-col transition-all cursor-pointer ${
                      isAdded 
                        ? 'border-[#333] opacity-50 cursor-not-allowed' 
                        : 'border-[#333] hover:border-[#555] hover:bg-[#252525] hover:-translate-y-1 hover:shadow-xl'
                    }`}
                  >
                    {/* Visual Preview Header */}
                    <div className={`h-24 bg-gradient-to-br ${widget.color} relative overflow-hidden flex items-center justify-center`}>
                      <div className="absolute inset-0 bg-black/20" />
                      <div className="relative z-10 w-12 h-12 bg-black/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 shadow-lg">
                        {widget.icon}
                      </div>
                      {isAdded && (
                        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold text-white uppercase tracking-wider">
                          Adicionado
                        </div>
                      )}
                    </div>
                    {/* Content */}
                    <div className="p-4 flex-1 flex flex-col">
                      <h4 className="text-sm font-bold text-gray-200 mb-1.5">{widget.name}</h4>
                      <p className="text-xs text-gray-500 font-medium leading-relaxed">{widget.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredWidgets.length === 0 && (
              <div className="text-center py-20 text-gray-500">
                Nenhum cartão encontrado para esta categoria.
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
