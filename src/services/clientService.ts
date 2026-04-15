/**
 * Client Service — Acesso ao Supabase para o módulo de Clientes
 */
import { supabase } from '../lib/supabase';
import type { Client, ClientStatus } from '../types';

function mapRowToClient(row: Record<string, unknown>): Client {
  return {
    id: row.id as string,
    name: row.name as string,
    statusId: row.status_id as string,
    assignees: (row.assignees as string[]) ?? [],
    faturamento: row.faturamento as string | undefined,
    segmento: row.segmento as string | undefined,
    repositorio: row.repositorio as string | undefined,
    ultimaReuniao: row.ultima_reuniao as string | undefined,
  };
}

function mapRowToClientStatus(row: Record<string, unknown>): ClientStatus {
  return {
    id: row.id as string,
    name: row.name as string,
    color: row.color as string,
  };
}

export async function fetchClientStatuses(): Promise<ClientStatus[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('client_statuses')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) throw new Error(`[clientService] fetchClientStatuses: ${error.message}`);
  return (data ?? []).map(row => mapRowToClientStatus(row as Record<string, unknown>));
}

export async function fetchClients(): Promise<Client[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) throw new Error(`[clientService] fetchClients: ${error.message}`);
  return (data ?? []).map(row => mapRowToClient(row as Record<string, unknown>));
}

export async function createClient(client: Omit<Client, 'id'>): Promise<Client> {
  if (!supabase) throw new Error('[clientService] Supabase não disponível');

  const { data, error } = await supabase
    .from('clients')
    .insert({
      name: client.name,
      status_id: client.statusId,
      assignees: client.assignees,
      faturamento: client.faturamento,
      segmento: client.segmento,
      repositorio: client.repositorio,
      ultima_reuniao: client.ultimaReuniao,
    })
    .select()
    .single();

  if (error) throw new Error(`[clientService] createClient: ${error.message}`);
  return mapRowToClient(data as Record<string, unknown>);
}

export async function updateClient(id: string, patch: Partial<Client>): Promise<void> {
  if (!supabase) return;

  const dbPatch: Record<string, unknown> = {};
  if (patch.name !== undefined)         dbPatch.name = patch.name;
  if (patch.statusId !== undefined)     dbPatch.status_id = patch.statusId;
  if (patch.assignees !== undefined)    dbPatch.assignees = patch.assignees;
  if (patch.faturamento !== undefined)  dbPatch.faturamento = patch.faturamento;
  if (patch.segmento !== undefined)     dbPatch.segmento = patch.segmento;
  if (patch.repositorio !== undefined)  dbPatch.repositorio = patch.repositorio;
  if (patch.ultimaReuniao !== undefined) dbPatch.ultima_reuniao = patch.ultimaReuniao;

  const { error } = await supabase.from('clients').update(dbPatch).eq('id', id);
  if (error) throw new Error(`[clientService] updateClient: ${error.message}`);
}

export async function deleteClient(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('clients').delete().eq('id', id);
  if (error) throw new Error(`[clientService] deleteClient: ${error.message}`);
}
