/**
 * Meeting Service — Acesso ao Supabase para o módulo Agendamento
 */
import { supabase } from '../lib/supabase';
import type { Meeting } from '../types';

function mapRowToMeeting(row: Record<string, unknown>): Meeting {
  return {
    id: row.id as number,
    title: row.title as string,
    date: row.date as string,
    time: row.time as string,
    client: row.client as string,
    platform: row.platform as string,
    isToday: Boolean(row.is_today),
  };
}

export async function fetchMeetings(): Promise<Meeting[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('meetings')
    .select('*')
    .order('date', { ascending: true });

  if (error) throw new Error(`[meetingService] fetchMeetings: ${error.message}`);
  return (data ?? []).map(row => mapRowToMeeting(row as Record<string, unknown>));
}

export async function createMeeting(meeting: Omit<Meeting, 'id'>): Promise<Meeting> {
  if (!supabase) throw new Error('[meetingService] Supabase não disponível');

  const { data, error } = await supabase
    .from('meetings')
    .insert({
      title: meeting.title,
      date: meeting.date,
      time: meeting.time,
      client: meeting.client,
      platform: meeting.platform,
      is_today: meeting.isToday,
    })
    .select()
    .single();

  if (error) throw new Error(`[meetingService] createMeeting: ${error.message}`);
  return mapRowToMeeting(data as Record<string, unknown>);
}

export async function updateMeeting(id: number, patch: Partial<Meeting>): Promise<void> {
  if (!supabase) return;

  const dbPatch: Record<string, unknown> = {};
  if (patch.title !== undefined)    dbPatch.title = patch.title;
  if (patch.date !== undefined)     dbPatch.date = patch.date;
  if (patch.time !== undefined)     dbPatch.time = patch.time;
  if (patch.client !== undefined)   dbPatch.client = patch.client;
  if (patch.platform !== undefined) dbPatch.platform = patch.platform;
  if (patch.isToday !== undefined)  dbPatch.is_today = patch.isToday;

  const { error } = await supabase.from('meetings').update(dbPatch).eq('id', id);
  if (error) throw new Error(`[meetingService] updateMeeting: ${error.message}`);
}

export async function deleteMeeting(id: number): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('meetings').delete().eq('id', id);
  if (error) throw new Error(`[meetingService] deleteMeeting: ${error.message}`);
}
