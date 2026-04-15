/**
 * Lead Service — Acesso ao Supabase para o módulo CRM & Vendas
 */
import { supabase } from '../lib/supabase';
import type { Lead, LeadActivity, LeadTask } from '../types';

// ─── Mapper: DB Row → Lead ───────────────────────────────────────────────────
function mapRowToLead(
  row: Record<string, unknown>,
  activities: LeadActivity[] = [],
  tasks: LeadTask[] = []
): Lead {
  return {
    id: row.id as string,
    columnId: row.column_id as string,
    title: row.title as string,
    value: Number(row.value),
    date: row.date as string,
    contactName: row.contact_name as string | undefined,
    email: row.email as string | undefined,
    phone: row.phone as string | undefined,
    companyName: row.company_name as string | undefined,
    companyEmail: row.company_email as string | undefined,
    companyPhone: row.company_phone as string | undefined,
    companyCNPJ: row.company_cnpj as string | undefined,
    companyAddress: row.company_address as string | undefined,
    activities,
    tasks,
  };
}

// ─── Lead CRUD ────────────────────────────────────────────────────────────────
export async function fetchLeads(): Promise<Lead[]> {
  if (!supabase) return [];

  const [leadsResult, activitiesResult, tasksResult] = await Promise.all([
    supabase.from('crm_leads').select('*').order('sort_order', { ascending: true }),
    fetchAllLeadActivities(),
    fetchAllLeadTasks(),
  ]);

  if (leadsResult.error) throw new Error(`[leadService] fetchLeads: ${leadsResult.error.message}`);

  return (leadsResult.data ?? []).map(row => {
    const leadRow = row as Record<string, unknown>;
    const leadId = leadRow.id as string;
    return mapRowToLead(
      leadRow,
      activitiesResult.filter(a => a.leadId === leadId),
      tasksResult.filter(t => t.leadId === leadId)
    );
  });
}

async function fetchAllLeadActivities(): Promise<(LeadActivity & { leadId: string })[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('lead_activities' as never)
      .select('*')
      .order('created_at', { ascending: true });

    if (error) return [];
    return ((data ?? []) as Record<string, unknown>[]).map(r => ({
      id: r.id as string,
      leadId: r.lead_id as string,
      type: r.type as LeadActivity['type'],
      content: r.content as string,
      authorName: r.author_name as string | undefined,
      date: r.created_at as string,
    }));
  } catch {
    return [];
  }
}

async function fetchAllLeadTasks(): Promise<LeadTask[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('lead_tasks' as never)
      .select('*')
      .order('created_at', { ascending: true });

    if (error) return [];
    return ((data ?? []) as Record<string, unknown>[]).map(r => ({
      id: r.id as string,
      leadId: r.lead_id as string,
      title: r.title as string,
      dueDate: r.due_date as string | undefined,
      dueTime: r.due_time as string | undefined,
      done: Boolean(r.done),
      createdAt: r.created_at as string,
    }));
  } catch {
    return [];
  }
}

export async function createLead(lead: Omit<Lead, 'id' | 'activities' | 'tasks'>): Promise<Lead> {
  if (!supabase) throw new Error('[leadService] Supabase não disponível');

  const { data, error } = await supabase
    .from('crm_leads')
    .insert({
      column_id: lead.columnId,
      title: lead.title,
      value: lead.value,
      date: lead.date,
      contact_name: lead.contactName,
      email: lead.email,
      phone: lead.phone,
      company_name: lead.companyName,
      company_email: lead.companyEmail,
      company_phone: lead.companyPhone,
      company_cnpj: lead.companyCNPJ,
      company_address: lead.companyAddress,
    })
    .select()
    .single();

  if (error) throw new Error(`[leadService] createLead: ${error.message}`);

  const newLead = mapRowToLead(data as Record<string, unknown>);

  // Registrar atividade de criação
  await addLeadActivity(newLead.id, {
    type: 'created',
    content: 'Lead criado',
    date: new Date().toISOString(),
  });

  return newLead;
}

export async function updateLead(id: string, patch: Partial<Lead>): Promise<void> {
  if (!supabase) return;

  const dbPatch: Record<string, unknown> = {};
  if (patch.columnId !== undefined)    dbPatch.column_id = patch.columnId;
  if (patch.title !== undefined)       dbPatch.title = patch.title;
  if (patch.value !== undefined)       dbPatch.value = patch.value;
  if (patch.date !== undefined)        dbPatch.date = patch.date;
  if (patch.contactName !== undefined) dbPatch.contact_name = patch.contactName;
  if (patch.email !== undefined)       dbPatch.email = patch.email;
  if (patch.phone !== undefined)       dbPatch.phone = patch.phone;
  if (patch.companyName !== undefined) dbPatch.company_name = patch.companyName;
  if (patch.companyEmail !== undefined) dbPatch.company_email = patch.companyEmail;
  if (patch.companyPhone !== undefined) dbPatch.company_phone = patch.companyPhone;
  if (patch.companyCNPJ !== undefined) dbPatch.company_cnpj = patch.companyCNPJ;
  if (patch.companyAddress !== undefined) dbPatch.company_address = patch.companyAddress;

  const { error } = await supabase.from('crm_leads').update(dbPatch).eq('id', id);
  if (error) throw new Error(`[leadService] updateLead: ${error.message}`);
}

/**
 * Mover lead entre colunas do pipeline.
 * IMPORTANTE: O trigger `on_lead_won` no DB já cria a transação financeira
 * automaticamente quando column_id muda para 'ganho'. NÃO duplicar no frontend.
 */
export async function moveLead(leadId: string, newColumnId: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from('crm_leads')
    .update({ column_id: newColumnId })
    .eq('id', leadId);

  if (error) throw new Error(`[leadService] moveLead: ${error.message}`);
}

export async function deleteLead(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('crm_leads').delete().eq('id', id);
  if (error) throw new Error(`[leadService] deleteLead: ${error.message}`);
}

// ─── Lead Activities ──────────────────────────────────────────────────────────
export async function addLeadActivity(
  leadId: string,
  activity: Omit<LeadActivity, 'id'>
): Promise<LeadActivity> {
  const fallback: LeadActivity = {
    ...activity,
    id: `act-${Date.now()}`,
  };

  if (!supabase) return fallback;

  try {
    const { data, error } = await supabase
      .from('lead_activities' as never)
      .insert({
        lead_id: leadId,
        type: activity.type,
        content: activity.content,
        author_name: activity.authorName,
      })
      .select()
      .single();

    if (error) return fallback;
    const row = data as Record<string, unknown>;
    return {
      id: row.id as string,
      type: row.type as LeadActivity['type'],
      content: row.content as string,
      authorName: row.author_name as string | undefined,
      date: row.created_at as string,
    };
  } catch {
    return fallback;
  }
}

// ─── Lead Tasks ───────────────────────────────────────────────────────────────
export async function addLeadTask(
  leadId: string,
  task: Pick<LeadTask, 'title' | 'dueDate' | 'dueTime'>
): Promise<LeadTask> {
  const fallback: LeadTask = {
    ...task,
    id: `lt-${Date.now()}`,
    leadId,
    done: false,
    createdAt: new Date().toISOString(),
  };

  if (!supabase) return fallback;

  try {
    const { data, error } = await supabase
      .from('lead_tasks' as never)
      .insert({
        lead_id: leadId,
        title: task.title,
        due_date: task.dueDate,
        due_time: task.dueTime,
        done: false,
      })
      .select()
      .single();

    if (error) return fallback;
    const row = data as Record<string, unknown>;
    return {
      id: row.id as string,
      leadId: row.lead_id as string,
      title: row.title as string,
      dueDate: row.due_date as string | undefined,
      dueTime: row.due_time as string | undefined,
      done: Boolean(row.done),
      createdAt: row.created_at as string,
    };
  } catch {
    return fallback;
  }
}

export async function toggleLeadTask(taskId: string, currentDone: boolean): Promise<void> {
  if (!supabase) return;
  try {
    await supabase
      .from('lead_tasks' as never)
      .update({ done: !currentDone } as never)
      .eq('id', taskId);
  } catch {
    // graceful degradation
  }
}
