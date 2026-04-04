import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronRight, Plus, CheckCircle2, MoreHorizontal, Trash2, Edit3, Copy, ArrowRightLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../context/AppContext';
import { useToast } from './Toast';
import { Client } from '../types';

interface ClientListProps {
  filteredClients?: Client[];
  searchQuery?: string;
}

const ClientList = ({ filteredClients: externalFilteredClients, searchQuery }: ClientListProps) => {
  const { clients, setClients, clientStatuses, addClient, deleteClient, updateClient } = useAppContext();
  const { showToast, ToastContainer } = useToast();
  
  // Use passed down prop or component's own query of clients if used isolated
  const displayClients = externalFilteredClients || clients;
  const isFiltering = !!searchQuery;

  const [newClientName, setNewClientName] = useState('');
  const [addingToStatus, setAddingToStatus] = useState<string | null>(null);
  const [editingClient, setEditingClient] = useState<{ id: string; field: string } | null>(null);
  const [collapsedStatuses, setCollapsedStatuses] = useState<Set<string>>(new Set());
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [moveMenuClientId, setMoveMenuClientId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
        setMoveMenuClientId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleCollapse = useCallback((statusId: string) => {
    setCollapsedStatuses(prev => {
      const next = new Set(prev);
      if (next.has(statusId)) next.delete(statusId);
      else next.add(statusId);
      return next;
    });
  }, []);

  const handleUpdateClient = useCallback((id: string, field: string, value: any) => {
    updateClient(id, { [field]: value });
    setEditingClient(null);
  }, [updateClient]);

  const handleAddClient = useCallback((statusId: string) => {
    if (!newClientName.trim()) {
      setAddingToStatus(null);
      return;
    }
    addClient({
      name: newClientName,
      statusId,
      assignees: ['https://i.pravatar.cc/150?img=11'],
      faturamento: '-',
      segmento: '-',
      repositorio: '-',
      ultimaReuniao: '-'
    });
    setNewClientName('');
    setAddingToStatus(null);
    setTimeout(() => showToast('Cliente adicionado com sucesso'), 0);
  }, [newClientName, addClient, showToast]);

  const handleDeleteClient = useCallback((clientId: string, clientName: string) => {
    const deleted = clients.find(c => c.id === clientId);
    deleteClient(clientId);
    setOpenMenuId(null);
    setTimeout(() => {
      showToast(`"${clientName}" removido`, () => {
        if (deleted) setClients(prev => [...prev, deleted]);
      });
    }, 0);
  }, [clients, deleteClient, setClients, showToast]);

  const handleDuplicateClient = useCallback((client: Client) => {
    addClient({
      name: `${client.name} (cópia)`,
      statusId: client.statusId,
      assignees: client.assignees,
      faturamento: client.faturamento,
      segmento: client.segmento,
      repositorio: client.repositorio,
      ultimaReuniao: client.ultimaReuniao
    });
    setOpenMenuId(null);
    setTimeout(() => showToast('Cliente duplicado'), 0);
  }, [addClient, showToast]);

  const handleMoveClient = useCallback((clientId: string, newStatusId: string) => {
    updateClient(clientId, { statusId: newStatusId });
    setOpenMenuId(null);
    setMoveMenuClientId(null);
    setTimeout(() => showToast('Status do cliente alterado'), 0);
  }, [updateClient, showToast]);

  const handleKeyDown = (e: React.KeyboardEvent, statusId: string) => {
    if (e.key === 'Enter') handleAddClient(statusId);
    else if (e.key === 'Escape') { setAddingToStatus(null); setNewClientName(''); }
  };

  return (
    <div className="p-6 min-w-[1200px]">
      {/* Filter indicator */}
      {isFiltering && (
        <div className="mb-4 px-4 py-2 bg-primary/5 border border-primary/20 rounded-lg flex items-center gap-2 text-xs text-primary">
          <span>Mostrando {displayClients.length} de {clients.length} clientes</span>
          {searchQuery && <span className="bg-primary/10 px-2 py-0.5 rounded">Busca: "{searchQuery}"</span>}
        </div>
      )}

      {/* Table Header */}
      <div className="flex items-center text-xs text-gray-500 font-medium border-b border-[#2b2b2b] pb-2 mb-4 px-4 pr-6">
        <div className="flex-[2] pl-6">Nome</div>
        <div className="flex-1">Responsável</div>
        <div className="flex-1">Faturamento Anual Co...</div>
        <div className="flex-1">Segmento de Atuação</div>
        <div className="flex-1">Repositório de Docum...</div>
        <div className="flex-1">Última Reunião de Suc...</div>
        <div className="flex-1">Status</div>
        <div className="w-10 flex justify-center"><Plus className="w-4 h-4 cursor-pointer hover:text-gray-300" /></div>
      </div>

      <div className="space-y-6">
        {clientStatuses.map(status => {
          const statusClients = displayClients.filter(c => c.statusId === status.id);
          const isCollapsed = collapsedStatuses.has(status.id);

          // Hide empty status groups when filtering
          if (isFiltering && statusClients.length === 0) return null;

          return (
            <div key={status.id} className="flex flex-col">
              {/* Status Header */}
              <div
                className="flex items-center gap-2 mb-2 group cursor-pointer sticky top-0 bg-[#141414] py-1 z-10"
                onClick={() => toggleCollapse(status.id)}
              >
                {isCollapsed ? (
                  <ChevronRight className="w-4 h-4 text-gray-500 hover:text-gray-300 transition-colors" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500 hover:text-gray-300 transition-colors" />
                )}
                <div
                  className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold text-white tracking-wide"
                  style={{ backgroundColor: status.color }}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  {status.name}
                </div>
                <span className="text-xs text-gray-500 font-medium">{statusClients.length}</span>
                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 ml-2 transition-opacity">
                  <Plus
                    className="w-4 h-4 text-gray-400 hover:text-gray-200"
                    onClick={(e) => { e.stopPropagation(); setAddingToStatus(status.id); }}
                  />
                </div>
              </div>

              {/* Clients List */}
              <AnimatePresence initial={false}>
                {!isCollapsed && (
                  <motion.div
                    key={`clients-${status.id}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col border-l border-[#2b2b2b] ml-2 pl-4 overflow-hidden"
                  >
                    {statusClients.map(client => (
                      <div
                        key={client.id}
                        className="flex items-center py-2 border-b border-[#2b2b2b] hover:bg-[#1e1e1e] group/row -ml-4 pl-4 pr-2 transition-colors relative"
                      >
                        <div className="flex-[2] flex items-center gap-3">
                          <div
                            className="w-3.5 h-3.5 rounded-sm border-2 flex-shrink-0 cursor-pointer hover:bg-opacity-20 transition-colors"
                            style={{ borderColor: status.color }}
                            onClick={() => {
                              const currentIndex = clientStatuses.findIndex(s => s.id === client.statusId);
                              const nextStatus = clientStatuses[(currentIndex + 1) % clientStatuses.length];
                              updateClient(client.id, { statusId: nextStatus.id });
                            }}
                          />
                          {editingClient?.id === client.id && editingClient?.field === 'name' ? (
                            <input
                              type="text"
                              autoFocus
                              defaultValue={client.name}
                              onBlur={(e) => handleUpdateClient(client.id, 'name', e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleUpdateClient(client.id, 'name', e.currentTarget.value);
                                if (e.key === 'Escape') setEditingClient(null);
                              }}
                              className="bg-transparent border-b border-primary outline-none text-sm text-white w-full"
                            />
                          ) : (
                            <span
                              className="text-sm text-gray-200 font-medium cursor-pointer hover:text-primary transition-colors truncate"
                              onClick={() => setEditingClient({ id: client.id, field: 'name' })}
                            >
                              {client.name}
                            </span>
                          )}
                        </div>

                        <div className="flex-1 flex items-center">
                          {client.assignees.map((avatar, i) => (
                            <img key={i} src={avatar} alt="Assignee" className="w-6 h-6 rounded-full border border-[#141414] cursor-pointer hover:ring-2 hover:ring-primary transition-all" />
                          ))}
                        </div>

                        {/* Editable fields */}
                        {(['faturamento', 'segmento', 'repositorio', 'ultimaReuniao'] as const).map(field => (
                          <div key={field} className="flex-1 text-sm text-gray-400">
                            {editingClient?.id === client.id && editingClient?.field === field ? (
                              <input
                                type="text"
                                autoFocus
                                defaultValue={(client as any)[field]}
                                onBlur={(e) => handleUpdateClient(client.id, field, e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleUpdateClient(client.id, field, e.currentTarget.value);
                                  if (e.key === 'Escape') setEditingClient(null);
                                }}
                                className="bg-[#1e1e1e] border border-[#333] rounded px-2 py-1 outline-none text-xs text-white w-full"
                              />
                            ) : (
                              <div
                                className="cursor-pointer hover:text-gray-200 transition-colors w-full h-full min-h-[20px]"
                                onClick={() => setEditingClient({ id: client.id, field })}
                              >
                                {(client as any)[field] || '-'}
                              </div>
                            )}
                          </div>
                        ))}

                        <div className="flex-1 text-sm text-gray-400">{status.name}</div>

                        {/* Context Menu */}
                        <div className="w-10 flex justify-center relative" ref={openMenuId === client.id ? menuRef : undefined}>
                          <button
                            className="opacity-0 group-hover/row:opacity-100 transition-opacity p-1 hover:bg-white/5 rounded"
                            onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === client.id ? null : client.id); setMoveMenuClientId(null); }}
                          >
                            <MoreHorizontal className="w-4 h-4 text-gray-400 hover:text-gray-200" />
                          </button>
                          <AnimatePresence>
                            {openMenuId === client.id && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                className="absolute right-0 top-full mt-1 bg-[#1e1e1e] border border-[#333] rounded-lg shadow-2xl z-50 w-44 py-1"
                              >
                                <button
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/5"
                                  onClick={() => { setEditingClient({ id: client.id, field: 'name' }); setOpenMenuId(null); }}
                                >
                                  <Edit3 className="w-3.5 h-3.5" /> Renomear
                                </button>
                                <button
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/5 transition-colors"
                                  onClick={() => handleDuplicateClient(client)}
                                >
                                  <Copy className="w-3.5 h-3.5" /> Duplicar
                                </button>
                                <button
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/5 transition-colors"
                                  onClick={() => setMoveMenuClientId(moveMenuClientId === client.id ? null : client.id)}
                                >
                                  <ArrowRightLeft className="w-3.5 h-3.5" /> Alterar Status
                                </button>
                                
                                {/* Move submenu */}
                                <AnimatePresence>
                                  {moveMenuClientId === client.id && (
                                    <motion.div
                                      initial={{ height: 0 }}
                                      animate={{ height: 'auto' }}
                                      exit={{ height: 0 }}
                                      className="overflow-hidden border-t border-[#333]"
                                    >
                                      {clientStatuses.filter(s => s.id !== client.statusId).map(s => (
                                        <button
                                          key={s.id}
                                          className="w-full flex items-center gap-2 px-5 py-1.5 text-xs text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
                                          onClick={() => handleMoveClient(client.id, s.id)}
                                        >
                                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                                          {s.name}
                                        </button>
                                      ))}
                                    </motion.div>
                                  )}
                                </AnimatePresence>

                                <div className="border-t border-[#333] mt-1" />
                                <button
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
                                  onClick={() => handleDeleteClient(client.id, client.name)}
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Deletar
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    ))}

                    {/* Add Client Input */}
                    {addingToStatus === status.id && (
                      <div className="flex items-center py-2 border-b border-[#2b2b2b] -ml-4 pl-4 pr-2">
                        <div className="flex-[2] flex items-center gap-3">
                          <div
                            className="w-3.5 h-3.5 rounded-sm border-2 flex-shrink-0"
                            style={{ borderColor: status.color }}
                          />
                          <input
                            type="text"
                            autoFocus
                            value={newClientName}
                            onChange={(e) => setNewClientName(e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, status.id)}
                            onBlur={() => handleAddClient(status.id)}
                            placeholder="Nome do cliente"
                            className="bg-transparent border-none outline-none text-sm text-white w-full placeholder-gray-600"
                          />
                        </div>
                      </div>
                    )}

                    {/* Add Client Row */}
                    {addingToStatus !== status.id && (
                      <div
                        className="flex items-center py-2 text-sm text-gray-500 hover:text-gray-300 cursor-pointer -ml-4 pl-4 group transition-colors"
                        onClick={() => setAddingToStatus(status.id)}
                      >
                        <div className="w-6 h-6 rounded-full bg-[#2b2b2b] flex items-center justify-center mr-3">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: status.color }} />
                        </div>
                        Adicionar Cliente
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {/* No results */}
        {isFiltering && displayClients.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-3">🔍</div>
            <div className="text-sm font-medium">Nenhum cliente encontrado</div>
            <div className="text-xs mt-1">Tente ajustar seus filtros</div>
          </div>
        )}

      </div>
      <ToastContainer />
    </div>
  );
};

export default ClientList;
