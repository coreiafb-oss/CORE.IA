import React, { useState, useMemo } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import ListView from './ListView';
import Overview from './Overview';
import ClientList from './ClientList';
import BoardView from './BoardView';
import CalendarView from './CalendarView';
import ClientBoardView from './ClientBoardView';
import SettingsModal from './SettingsModal';
import TaskDashboard from './TaskDashboard';
import { ViewType } from '../types';
import { useAppContext } from '../context/AppContext';
import { Modal } from './ui/Modal';

const ClickUpInterface = () => {
  const { tasks, setTasks, addTask, taskStatuses, clients, addClient, clientStatuses } = useAppContext();
  const [currentView, setCurrentView] = useState<ViewType>('overview');
  const [showSettings, setShowSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  
  // Task Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskStatus, setNewTaskStatus] = useState('s1');
  const [newTaskPriority, setNewTaskPriority] = useState('Normal');

  // Client Modal State
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientStatus, setNewClientStatus] = useState('cs1');
  const [newClientFaturamento, setNewClientFaturamento] = useState('');
  const [newClientSegmento, setNewClientSegmento] = useState('');
  const [newClientRepositorio, setNewClientRepositorio] = useState('');
  const [newClientReuniao, setNewClientReuniao] = useState('');

  // Handle "Add" button in TopBar — open specific modal
  const handleAddItem = () => {
    if (currentView === 'clients' || currentView === 'client-board' || currentView === 'client-database') {
      setShowAddClientModal(true);
      setNewClientName('');
      if (clientStatuses.length > 0) setNewClientStatus(clientStatuses[0].id);
      setNewClientFaturamento('');
      setNewClientSegmento('');
      setNewClientRepositorio('');
      setNewClientReuniao('');
    } else {
      setShowAddModal(true);
      setNewTaskName('');
      if (taskStatuses.length > 0) setNewTaskStatus(taskStatuses[0].id);
      setNewTaskPriority('Normal');
    }
  };

  const handleCreateTask = () => {
    if (!newTaskName.trim()) return;
    addTask({
      name: newTaskName,
      statusId: newTaskStatus,
      assignees: ['https://i.pravatar.cc/150?img=11'],
      dueDate: 'Hoje',
      priority: newTaskPriority as any,
    });
    setShowAddModal(false);
    setNewTaskName('');
  };

  const handleCreateClient = () => {
    if (!newClientName.trim()) return;
    addClient({
      name: newClientName,
      statusId: newClientStatus,
      assignees: ['https://i.pravatar.cc/150?img=11'],
      faturamento: newClientFaturamento || '-',
      segmento: newClientSegmento || '-',
      repositorio: newClientRepositorio || '-',
      ultimaReuniao: newClientReuniao || '-'
    });
    setShowAddClientModal(false);
    setNewClientName('');
  };

  // Filter tasks based on search + priority
  const filteredTasks = useMemo(() => {
    let result = tasks;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t => t.name.toLowerCase().includes(q));
    }
    if (filterPriority) {
      result = result.filter(t => t.priority === filterPriority);
    }
    return result;
  }, [tasks, searchQuery, filterPriority]);

  // Filter clients based on search
  const filteredClients = useMemo(() => {
    let result = clients;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c => c.name.toLowerCase().includes(q));
    }
    // Priority filter doesn't apply to clients, but you could add other filters here
    return result;
  }, [clients, searchQuery]);

  return (
    <div className="flex h-full w-full font-sans overflow-hidden selection:bg-primary/30" style={{ background: 'var(--surface-1)', color: 'var(--text-secondary)' }}>
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      <div className="flex-1 flex flex-col min-w-0 bg-[#141414]">
        <TopBar
          currentView={currentView}
          onOpenSettings={() => setShowSettings(true)}
          onViewChange={setCurrentView}
          onAddItem={handleAddItem}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filterPriority={filterPriority}
          onFilterChange={setFilterPriority}
        />
        <div className="flex-1 overflow-auto custom-scrollbar relative">
          {currentView === 'overview' && <Overview />}
          {currentView === 'task-dashboard' && <TaskDashboard />}
          {currentView === 'tasks' && (
            <ListView
              filteredTasks={filteredTasks}
              searchQuery={searchQuery}
              filterPriority={filterPriority}
            />
          )}
          {(currentView === 'clients' || currentView === 'client-database') && (
            <ClientList 
              filteredClients={filteredClients} 
              searchQuery={searchQuery}
            />
          )}
          {currentView === 'client-board' && (
             <ClientBoardView
               filteredClients={filteredClients}
               searchQuery={searchQuery}
             />
          )}
          {currentView === 'board' && (
            <BoardView
              filteredTasks={filteredTasks}
              searchQuery={searchQuery}
              filterPriority={filterPriority}
            />
          )}
          {currentView === 'calendar' && <CalendarView />}
        </div>
      </div>
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}

      {/* Quick Add Task Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Nova Tarefa">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-400 mb-1 block">Nome da tarefa</label>
            <input
              type="text"
              autoFocus
              value={newTaskName}
              onChange={(e) => setNewTaskName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreateTask(); }}
              placeholder="Ex: Criar banner para campanha..."
              className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-primary/50 placeholder-gray-600 transition-colors"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-400 mb-1 block">Status</label>
              <select
                value={newTaskStatus}
                onChange={(e) => setNewTaskStatus(e.target.value)}
                className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary/50 appearance-none cursor-pointer"
              >
                {taskStatuses.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-400 mb-1 block">Prioridade</label>
              <select
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value)}
                className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary/50 appearance-none cursor-pointer"
              >
                <option value="Urgent">🔴 Urgente</option>
                <option value="High">🟡 Alta</option>
                <option value="Normal">🔵 Normal</option>
                <option value="Low">⚪ Baixa</option>
                <option value="None">Nenhuma</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors rounded-lg"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreateTask}
              disabled={!newTaskName.trim()}
              className="px-6 py-2 text-sm font-medium bg-primary hover:bg-primary disabled:bg-primary/40 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              Criar Tarefa
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Client Modal */}
      <Modal isOpen={showAddClientModal} onClose={() => setShowAddClientModal(false)} title="Novo Cliente">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-400 mb-1 block">Nome do Cliente</label>
            <input
              type="text"
              autoFocus
              value={newClientName}
              onChange={(e) => setNewClientName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreateClient(); }}
              placeholder="Ex: Acme Corp..."
              className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-primary/50 placeholder-gray-600 transition-colors"
            />
          </div>
          
          <div>
            <label className="text-xs font-medium text-gray-400 mb-1 block">Status</label>
            <select
              value={newClientStatus}
              onChange={(e) => setNewClientStatus(e.target.value)}
              className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary/50 appearance-none cursor-pointer"
            >
              {clientStatuses.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-400 mb-1 block">Faturamento</label>
              <input
                type="text"
                value={newClientFaturamento}
                onChange={(e) => setNewClientFaturamento(e.target.value)}
                placeholder="Ex: R$ 50.000"
                className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary/50 placeholder-gray-600"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-400 mb-1 block">Segmento</label>
              <input
                type="text"
                value={newClientSegmento}
                onChange={(e) => setNewClientSegmento(e.target.value)}
                placeholder="Ex: Tecnologia"
                className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary/50 placeholder-gray-600"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-400 mb-1 block">Repositório</label>
              <input
                type="text"
                value={newClientRepositorio}
                onChange={(e) => setNewClientRepositorio(e.target.value)}
                placeholder="Ex: Google Drive"
                className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary/50 placeholder-gray-600"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-400 mb-1 block">Última Reunião</label>
              <input
                type="text"
                value={newClientReuniao}
                onChange={(e) => setNewClientReuniao(e.target.value)}
                placeholder="Ex: 10/11/2026"
                className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary/50 placeholder-gray-600"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowAddClientModal(false)}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors rounded-lg"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreateClient}
              disabled={!newClientName.trim()}
              className="px-6 py-2 text-sm font-medium bg-primary hover:bg-primary disabled:bg-primary/40 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              Criar Cliente
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default ClickUpInterface;
