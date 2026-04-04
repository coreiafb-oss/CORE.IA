import React, { useState, useRef } from 'react';
import { Plus, MoreHorizontal, GripVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../context/AppContext';
import { Client } from '../types';

interface ClientBoardViewProps {
  filteredClients: Client[];
  searchQuery: string;
}

const ClientBoardView = ({ filteredClients, searchQuery }: ClientBoardViewProps) => {
  const { setClients, clientStatuses, addClient } = useAppContext();
  const [newClientName, setNewClientName] = useState('');
  const [addingToColumn, setAddingToColumn] = useState<string | null>(null);
  const dragItem = useRef<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const isFiltering = !!searchQuery;

  const handleDragStart = (clientId: string) => {
    dragItem.current = clientId;
  };

  const handleDragOver = (e: React.DragEvent, statusId: string) => {
    e.preventDefault();
    setDragOverId(statusId);
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDrop = (statusId: string) => {
    if (dragItem.current) {
      setClients(prev =>
        prev.map(c => c.id === dragItem.current ? { ...c, statusId } : c)
      );
    }
    dragItem.current = null;
    setDragOverId(null);
  };

  const handleAddClient = (statusId: string) => {
    if (!newClientName.trim()) {
      setAddingToColumn(null);
      return;
    }
    const newClient: Client = {
      id: `client-${Date.now()}`,
      name: newClientName,
      statusId,
      assignees: ['https://i.pravatar.cc/150?img=11'],
      faturamento: '-',
      segmento: '-',
      repositorio: '-',
      ultimaReuniao: '-'
    };
    setClients(prev => [...prev, newClient]);
    setNewClientName('');
    setAddingToColumn(null);
  };

  return (
    <div className="flex gap-4 p-6 h-full overflow-x-auto custom-scrollbar">
      {clientStatuses.map(status => {
        const columnClients = filteredClients.filter(c => c.statusId === status.id);
        const isOver = dragOverId === status.id;

        // Hide empty columns when filtering
        if (isFiltering && columnClients.length === 0) return null;

        return (
          <div
            key={status.id}
            className={`flex flex-col min-w-[280px] max-w-[320px] w-[300px] flex-shrink-0 rounded-xl transition-all duration-200 ${
              isOver ? 'bg-white/5 ring-2 ring-primary/40' : 'bg-[#1a1a1a]/50'
            }`}
            onDragOver={(e) => handleDragOver(e, status.id)}
            onDragLeave={handleDragLeave}
            onDrop={() => handleDrop(status.id)}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between px-3 py-3 border-b border-[#2b2b2b]">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: status.color }} />
                <span className="text-sm font-semibold text-gray-200">{status.name}</span>
                <span className="text-xs text-gray-500 bg-[#2b2b2b] px-1.5 py-0.5 rounded-full font-medium">
                  {columnClients.length}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setAddingToColumn(status.id)}
                  className="p-1 text-gray-500 hover:text-gray-200 hover:bg-white/5 rounded transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button className="p-1 text-gray-500 hover:text-gray-200 hover:bg-white/5 rounded transition-colors">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Cards */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
              <AnimatePresence>
                {columnClients.map(client => {
                  return (
                    <motion.div
                      key={client.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      draggable
                      onDragStart={() => handleDragStart(client.id)}
                      className="bg-[#1e1e1e] border border-[#2b2b2b] rounded-lg p-3 cursor-grab active:cursor-grabbing hover:border-[#444] transition-all group shadow-sm hover:shadow-md"
                    >
                      <div className="w-full h-0.5 rounded-full mb-2" style={{ backgroundColor: status.color }} />
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm text-gray-200 font-medium leading-snug flex-1">
                          {client.name}
                        </span>
                        <GripVertical className="w-3.5 h-3.5 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5" />
                      </div>

                      <div className="mt-2 flex flex-col gap-1">
                        <div className="text-[10px] text-gray-500 flex justify-between">
                          <span>Faturamento:</span>
                          <span className="text-gray-300 font-medium">{client.faturamento || '-'}</span>
                        </div>
                        <div className="text-[10px] text-gray-500 flex justify-between">
                          <span>Segmento:</span>
                          <span className="text-gray-300 font-medium">{client.segmento || '-'}</span>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#2b2b2b]/50">
                        <div className="flex items-center gap-1.5">
                          {client.ultimaReuniao && client.ultimaReuniao !== '-' && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded text-gray-400 bg-white/5">
                              Última reunião: {client.ultimaReuniao}
                            </span>
                          )}
                        </div>
                        <div className="flex -space-x-1">
                          {client.assignees.slice(0, 2).map((avatar, i) => (
                            <img
                              key={i}
                              src={avatar}
                              alt="Assignee"
                              className="w-5 h-5 rounded-full border-2 border-[#1e1e1e]"
                            />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* Add Card Input */}
              {addingToColumn === status.id && (
                <div className="bg-[#1e1e1e] border border-primary/40 rounded-lg p-3">
                  <input
                    type="text"
                    autoFocus
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddClient(status.id);
                      if (e.key === 'Escape') { setAddingToColumn(null); setNewClientName(''); }
                    }}
                    onBlur={() => handleAddClient(status.id)}
                    placeholder="Nome do cliente..."
                    className="bg-transparent border-none outline-none text-sm text-white w-full placeholder-gray-600"
                  />
                </div>
              )}
            </div>

            {/* Add Card Button */}
            {addingToColumn !== status.id && (
              <button
                onClick={() => setAddingToColumn(status.id)}
                className="flex items-center gap-1.5 px-3 py-2.5 text-sm text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors m-1 rounded-lg"
              >
                <Plus className="w-4 h-4" />
                Adicionar cliente
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ClientBoardView;
