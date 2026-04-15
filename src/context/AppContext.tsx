/**
 * AppContext — Slim Orchestrator
 * 
 * Este context NÃO contém lógica de negócio, acesso ao banco ou persistência.
 * Ele apenas delega para os hooks especializados e expõe uma interface unificada
 * compatível com todos os componentes existentes (zero breaking changes).
 * 
 * Arquitetura:
 *   useTasks      → tasks, statuses, automations
 *   useLeads      → leads, crmColumns
 *   useContent    → contentItems
 *   useTransactions → transactions
 *   useClients    → clients, clientStatuses
 *   useMeetings   → meetings
 *   Local state   → watchedVideos (progresso academy — por usuário, sem DB)
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Task, Lead, Transaction, ContentItem, Meeting, Client, Status, ClientStatus,
  TaskComment, TaskAttachment, Automation, CrmColumn, LeadActivity, LeadTask,
} from '../types';
import { useTasks } from '../hooks/useTasks';
import { useLeads } from '../hooks/useLeads';
import { useContent } from '../hooks/useContent';
import { useTransactions } from '../hooks/useTransactions';
import { useClients } from '../hooks/useClients';
import { useMeetings } from '../hooks/useMeetings';
import { useAuth } from './AuthContext';

// ─── Usuários mock do sistema (mantidos para compatibilidade de UI) ────────────
export const SYSTEM_USERS = [
  { id: 'u1', name: 'Arthur', avatar: 'https://i.pravatar.cc/150?img=11' },
  { id: 'u2', name: 'Lucas',  avatar: 'https://i.pravatar.cc/150?img=33' },
  { id: 'u3', name: 'Camila', avatar: 'https://i.pravatar.cc/150?img=47' },
  { id: 'u4', name: 'Rafael', avatar: 'https://i.pravatar.cc/150?img=52' },
];

// ─── Interface pública (100% compatível com versão anterior) ──────────────────
interface AppContextType {
  // State
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  leads: Lead[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  contentItems: ContentItem[];
  setContentItems: React.Dispatch<React.SetStateAction<ContentItem[]>>;
  meetings: Meeting[];
  setMeetings: React.Dispatch<React.SetStateAction<Meeting[]>>;
  watchedVideos: string[];
  setWatchedVideos: React.Dispatch<React.SetStateAction<string[]>>;
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  taskStatuses: Status[];
  setTaskStatuses: React.Dispatch<React.SetStateAction<Status[]>>;
  clientStatuses: ClientStatus[];
  setClientStatuses: React.Dispatch<React.SetStateAction<ClientStatus[]>>;
  crmColumns: CrmColumn[];
  automations: Automation[];
  setAutomations: React.Dispatch<React.SetStateAction<Automation[]>>;

  // Loading states
  isTasksLoading: boolean;
  isLeadsLoading: boolean;

  // Task Actions
  addTask: (task: Omit<Task, 'id'>) => void;
  deleteTask: (taskId: string) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  addComment: (taskId: string, content: string) => void;
  addAttachment: (taskId: string, attachment: Omit<TaskAttachment, 'id' | 'uploadedAt'>) => void;
  removeAttachment: (taskId: string, attachmentId: string) => void;

  // Status Actions
  addTaskStatus: (status: Omit<Status, 'id'>) => void;

  // Client Actions
  addClient: (client: Omit<Client, 'id'>) => void;
  deleteClient: (clientId: string) => void;
  updateClient: (clientId: string, updates: Partial<Client>) => void;

  // CRM Column Actions
  addCrmColumn: (col: Omit<CrmColumn, 'id'>) => void;
  updateCrmColumn: (colId: string, updates: Partial<CrmColumn>) => void;
  removeCrmColumn: (colId: string) => void;

  // Lead Actions
  updateLeadStatus: (leadId: string, newColumnId: string) => void;
  addTransaction: (tx: Omit<Transaction, 'id'>) => void;
  addLead: (lead: Omit<Lead, 'id'>) => void;
  updateLeadDetails: (leadId: string, updates: Partial<Lead>) => void;
  addLeadActivity: (leadId: string, activity: Omit<LeadActivity, 'id'>) => void;
  addLeadTask: (leadId: string, task: Omit<LeadTask, 'id' | 'leadId' | 'createdAt'>) => void;
  toggleLeadTask: (leadId: string, taskId: string) => void;

  // Others
  addMeeting: (meeting: Omit<Meeting, 'id'>) => void;
  addContentItem: (item: Omit<ContentItem, 'id'>) => void;
  toggleVideoWatched: (videoId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile } = useAuth();

  // ─── Hooks especializados ─────────────────────────────────────────────────
  const tasksHook = useTasks(profile?.fullName, profile?.avatarUrl ?? undefined);
  const leadsHook = useLeads();
  const contentHook = useContent();
  const transactionsHook = useTransactions();
  const clientsHook = useClients();
  const meetingsHook = useMeetings();

  // ─── Academy – watched videos (config por usuário, localStorage) ──────────
  const [watchedVideos, setWatchedVideos] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('line_os_academy_watched');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('line_os_academy_watched', JSON.stringify(watchedVideos));
  }, [watchedVideos]);

  const toggleVideoWatched = useCallback((videoId: string) => {
    setWatchedVideos(prev =>
      prev.includes(videoId) ? prev.filter(v => v !== videoId) : [...prev, videoId]
    );
  }, []);

  // ─── Wrapper para updateLeadStatus (precisa das crmColumns) ──────────────
  const updateLeadStatus = useCallback((leadId: string, newColumnId: string) => {
    leadsHook.updateLeadStatus(leadId, newColumnId, leadsHook.crmColumns);
  }, [leadsHook]);

  // ─── Wrapper para addLeadTask (adapta interface) ──────────────────────────
  const addLeadTask = useCallback((leadId: string, task: Omit<LeadTask, 'id' | 'leadId' | 'createdAt'>) => {
    leadsHook.addLeadTask(leadId, {
      title: task.title,
      dueDate: task.dueDate,
      dueTime: task.dueTime,
    });
  }, [leadsHook]);

  return (
    <AppContext.Provider value={{
      // Tasks
      tasks: tasksHook.tasks,
      setTasks: tasksHook.setTasks,
      taskStatuses: tasksHook.taskStatuses,
      setTaskStatuses: tasksHook.setTaskStatuses,
      automations: tasksHook.automations,
      setAutomations: tasksHook.setAutomations,
      isTasksLoading: tasksHook.isLoading,

      // Leads + CRM
      leads: leadsHook.leads,
      setLeads: leadsHook.setLeads,
      crmColumns: leadsHook.crmColumns,
      isLeadsLoading: leadsHook.isLoading,

      // Content
      contentItems: contentHook.contentItems,
      setContentItems: contentHook.setContentItems,

      // Transactions
      transactions: transactionsHook.transactions,
      setTransactions: transactionsHook.setTransactions,

      // Clients
      clients: clientsHook.clients,
      setClients: clientsHook.setClients,
      clientStatuses: clientsHook.clientStatuses,
      setClientStatuses: clientsHook.setClientStatuses,

      // Meetings
      meetings: meetingsHook.meetings,
      setMeetings: meetingsHook.setMeetings,

      // Academy
      watchedVideos,
      setWatchedVideos,

      // Task Actions
      addTask: tasksHook.addTask,
      deleteTask: tasksHook.deleteTask,
      updateTask: tasksHook.updateTask,
      addComment: tasksHook.addComment,
      addAttachment: tasksHook.addAttachment,
      removeAttachment: tasksHook.removeAttachment,
      addTaskStatus: tasksHook.addTaskStatus,

      // Client Actions
      addClient: clientsHook.addClient,
      deleteClient: clientsHook.deleteClient,
      updateClient: clientsHook.updateClient,

      // CRM Column Actions
      addCrmColumn: leadsHook.addCrmColumn,
      updateCrmColumn: leadsHook.updateCrmColumn,
      removeCrmColumn: leadsHook.removeCrmColumn,

      // Lead Actions
      updateLeadStatus,
      addTransaction: transactionsHook.addTransaction,
      addLead: leadsHook.addLead,
      updateLeadDetails: leadsHook.updateLeadDetails,
      addLeadActivity: leadsHook.addLeadActivity,
      addLeadTask,
      toggleLeadTask: leadsHook.toggleLeadTask,

      // Others
      addMeeting: meetingsHook.addMeeting,
      addContentItem: contentHook.addContentItem,
      toggleVideoWatched,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};
