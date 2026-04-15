/**
 * useLeads — Hook especializado para o módulo CRM & Vendas
 * Responsável por: estado, Realtime e todas as actions de leads.
 * 
 * IMPORTANTE: A movimentação de lead para 'ganho' NÃO cria transação no frontend.
 * O trigger `on_lead_won` no PostgreSQL cuida disso automaticamente.
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import {
  fetchLeads, createLead, updateLead, moveLead as moveLeadDB,
  deleteLead, addLeadActivity, addLeadTask as addLeadTaskDB,
  toggleLeadTask as toggleLeadTaskDB,
} from '../services';
import type { Lead, CrmColumn, LeadActivity, LeadTask } from '../types';
import { crmLeads as initialLeads } from '../data';

const DEFAULT_CRM_COLUMNS: CrmColumn[] = [
  { id: 'leads',    title: 'Leads',             color: 'bg-blue-500',   accent: 'blue'   },
  { id: 'agendada', title: 'Reunião Agendada',   color: 'bg-primary',    accent: 'purple' },
  { id: 'proposta', title: 'Proposta Enviada',   color: 'bg-orange-500', accent: 'orange' },
  { id: 'ganho',    title: 'Fechado (Ganho)',    color: 'bg-green-500',  accent: 'green'  },
  { id: 'perdido',  title: 'Perdido',            color: 'bg-red-500',    accent: 'red'    },
];

function loadCrmColumns(): CrmColumn[] {
  try {
    const saved = localStorage.getItem('line_os_crm_columns');
    return saved ? JSON.parse(saved) : DEFAULT_CRM_COLUMNS;
  } catch {
    return DEFAULT_CRM_COLUMNS;
  }
}

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [crmColumns, setCrmColumns] = useState<CrmColumn[]>(loadCrmColumns);
  const [isLoading, setIsLoading] = useState(true);

  // Persistir configuração de colunas localmente (é config de UI)
  useEffect(() => {
    localStorage.setItem('line_os_crm_columns', JSON.stringify(crmColumns));
  }, [crmColumns]);

  // ─── Carregamento inicial ──────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      try {
        const data = await fetchLeads();
        if (!cancelled) {
          setLeads(data.length > 0 ? data : initialLeads);
        }
      } catch (err) {
        console.error('[useLeads] Erro ao carregar:', err);
        if (!cancelled) {
          const saved = localStorage.getItem('line_os_leads_v2');
          setLeads(saved ? JSON.parse(saved) : initialLeads);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  // ─── Realtime Subscription ─────────────────────────────────────────────────
  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel('leads_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'crm_leads' }, () => {
        fetchLeads().then(data => {
          if (data.length > 0) setLeads(data);
        }).catch(console.error);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // ─── CRM Column Actions ────────────────────────────────────────────────────
  const addCrmColumn = useCallback((col: Omit<CrmColumn, 'id'>) => {
    const newCol: CrmColumn = { ...col, id: `col-${Date.now()}` };
    setCrmColumns(prev => [...prev, newCol]);
  }, []);

  const updateCrmColumn = useCallback((colId: string, updates: Partial<CrmColumn>) => {
    setCrmColumns(prev => prev.map(c => c.id === colId ? { ...c, ...updates } : c));
  }, []);

  const removeCrmColumn = useCallback((colId: string) => {
    setCrmColumns(prev => prev.filter(c => c.id !== colId));
    setLeads(prev => prev.map(l => l.columnId === colId ? { ...l, columnId: 'leads' } : l));
  }, []);

  // ─── Lead Actions ──────────────────────────────────────────────────────────
  const addLead = useCallback(async (lead: Omit<Lead, 'id' | 'activities' | 'tasks'>) => {
    const tempId = `lead-${Date.now()}`;
    const optimistic: Lead = {
      ...lead,
      id: tempId,
      activities: [{ id: `act-${Date.now()}`, type: 'created', content: 'Lead criado', date: new Date().toISOString() }],
      tasks: [],
    };
    setLeads(prev => [optimistic, ...prev]);

    try {
      const saved = await createLead(lead);
      setLeads(prev => prev.map(l => l.id === tempId ? saved : l));
    } catch (err) {
      console.error('[useLeads] addLead falhou:', err);
    }
  }, []);

  const updateLeadDetails = useCallback(async (leadId: string, updates: Partial<Lead>) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, ...updates } : l));
    try {
      await updateLead(leadId, updates);
    } catch (err) {
      console.error('[useLeads] updateLeadDetails falhou:', err);
    }
  }, []);

  /**
   * Mover lead entre colunas.
   * Quando movido para 'ganho', o trigger PostgreSQL cria a transação financeira.
   * NÃO criamos transação aqui para evitar duplicação.
   */
  const updateLeadStatus = useCallback(async (
    leadId: string,
    newColumnId: string,
    crmColumnsList: CrmColumn[]
  ) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    const colName = crmColumnsList.find(c => c.id === newColumnId)?.title ?? newColumnId;
    const fromColName = crmColumnsList.find(c => c.id === lead.columnId)?.title ?? lead.columnId;

    const activity: LeadActivity = {
      id: `act-${Date.now()}`,
      type: 'status_change',
      content: `Movido de "${fromColName}" para "${colName}"`,
      date: new Date().toISOString(),
    };

    // Optimistic update
    setLeads(prev => prev.map(l =>
      l.id === leadId
        ? { ...l, columnId: newColumnId, activities: [...(l.activities ?? []), activity] }
        : l
    ));

    try {
      await moveLeadDB(leadId, newColumnId);
      await addLeadActivity(leadId, activity);
    } catch (err) {
      console.error('[useLeads] updateLeadStatus falhou:', err);
    }
  }, [leads]);

  const removeLead = useCallback(async (leadId: string) => {
    setLeads(prev => prev.filter(l => l.id !== leadId));
    try {
      await deleteLead(leadId);
    } catch (err) {
      console.error('[useLeads] removeLead falhou:', err);
    }
  }, []);

  const addActivity = useCallback(async (leadId: string, activity: Omit<LeadActivity, 'id'>) => {
    const optimistic: LeadActivity = { ...activity, id: `act-${Date.now()}` };
    setLeads(prev => prev.map(l =>
      l.id === leadId
        ? { ...l, activities: [...(l.activities ?? []), optimistic] }
        : l
    ));
    try {
      const saved = await addLeadActivity(leadId, activity);
      setLeads(prev => prev.map(l => {
        if (l.id !== leadId) return l;
        return {
          ...l,
          activities: (l.activities ?? []).map(a => a.id === optimistic.id ? saved : a),
        };
      }));
    } catch (err) {
      console.error('[useLeads] addActivity falhou:', err);
    }
  }, []);

  const addTask = useCallback(async (leadId: string, task: Pick<LeadTask, 'title' | 'dueDate' | 'dueTime'>) => {
    const optimistic: LeadTask = {
      ...task,
      id: `lt-${Date.now()}`,
      leadId,
      done: false,
      createdAt: new Date().toISOString(),
    };
    setLeads(prev => prev.map(l =>
      l.id === leadId ? { ...l, tasks: [...(l.tasks ?? []), optimistic] } : l
    ));

    // Registrar atividade
    const activity: Omit<LeadActivity, 'id'> = {
      type: 'task_created',
      content: `Tarefa criada: "${task.title}"`,
      date: new Date().toISOString(),
    };
    setLeads(prev => prev.map(l =>
      l.id === leadId
        ? { ...l, activities: [...(l.activities ?? []), { ...activity, id: `act-${Date.now()}` }] }
        : l
    ));

    try {
      const saved = await addLeadTaskDB(leadId, task);
      setLeads(prev => prev.map(l => {
        if (l.id !== leadId) return l;
        return { ...l, tasks: (l.tasks ?? []).map(t => t.id === optimistic.id ? saved : t) };
      }));
      await addLeadActivity(leadId, activity);
    } catch (err) {
      console.error('[useLeads] addTask falhou:', err);
    }
  }, []);

  const toggleTask = useCallback(async (leadId: string, taskId: string) => {
    let currentDone = false;
    setLeads(prev => prev.map(l => {
      if (l.id !== leadId) return l;
      const updatedTasks = (l.tasks ?? []).map(t => {
        if (t.id === taskId) {
          currentDone = t.done;
          return { ...t, done: !t.done };
        }
        return t;
      });
      return { ...l, tasks: updatedTasks };
    }));
    try {
      await toggleLeadTaskDB(taskId, currentDone);
    } catch (err) {
      console.error('[useLeads] toggleTask falhou:', err);
    }
  }, []);

  return {
    leads, setLeads,
    crmColumns, setCrmColumns,
    isLoading,
    // CRM Column actions
    addCrmColumn, updateCrmColumn, removeCrmColumn,
    // Lead actions
    addLead,
    updateLeadDetails,
    updateLeadStatus,
    deleteLead: removeLead,
    addLeadActivity: addActivity,
    addLeadTask: addTask,
    toggleLeadTask: toggleTask,
  };
}
