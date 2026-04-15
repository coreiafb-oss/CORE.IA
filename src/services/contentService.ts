/**
 * Content Service — Acesso ao Supabase para o módulo Aprovação de Conteúdo
 */
import { supabase } from '../lib/supabase';
import type { ContentItem, ContentStatus } from '../types';

function mapRowToContent(row: Record<string, unknown>): ContentItem {
  return {
    id: row.id as number,
    title: row.title as string,
    type: row.type as ContentItem['type'],
    status: row.status as ContentStatus,
    date: row.date as string,
    feedback: row.feedback as string | null,
    thumbnail: row.thumbnail as string,
    color: row.color as string,
    textColor: row.text_color as string,
    linkedTaskId: row.linked_task_id as string | undefined,
  };
}

export async function fetchContentItems(): Promise<ContentItem[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('content_items')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) throw new Error(`[contentService] fetchContentItems: ${error.message}`);
  return (data ?? []).map(row => mapRowToContent(row as Record<string, unknown>));
}

export async function createContentItem(
  item: Omit<ContentItem, 'id'>
): Promise<ContentItem> {
  if (!supabase) throw new Error('[contentService] Supabase não disponível');

  const { data, error } = await supabase
    .from('content_items')
    .insert({
      title: item.title,
      type: item.type as 'video' | 'image' | 'pdf',
      status: item.status as 'PENDENTE' | 'REVISÃO' | 'ALTERAÇÃO' | 'APROVADO',
      date: item.date,
      feedback: item.feedback,
      thumbnail: item.thumbnail,
      color: item.color,
      text_color: item.textColor,
      linked_task_id: item.linkedTaskId,
    })
    .select()
    .single();

  if (error) throw new Error(`[contentService] createContentItem: ${error.message}`);
  return mapRowToContent(data as Record<string, unknown>);
}

export async function updateContentStatus(
  id: number,
  status: ContentStatus,
  feedback?: string | null
): Promise<void> {
  if (!supabase) return;
  const patch: Record<string, unknown> = { status };
  if (feedback !== undefined) patch.feedback = feedback;

  const { error } = await supabase.from('content_items').update(patch).eq('id', id);
  if (error) throw new Error(`[contentService] updateContentStatus: ${error.message}`);
}

export async function updateContentItem(
  id: number,
  patch: Partial<Omit<ContentItem, 'id'>>
): Promise<void> {
  if (!supabase) return;

  const dbPatch: Record<string, unknown> = {};
  if (patch.title !== undefined)      dbPatch.title = patch.title;
  if (patch.type !== undefined)       dbPatch.type = patch.type;
  if (patch.status !== undefined)     dbPatch.status = patch.status;
  if (patch.date !== undefined)       dbPatch.date = patch.date;
  if (patch.feedback !== undefined)   dbPatch.feedback = patch.feedback;
  if (patch.thumbnail !== undefined)  dbPatch.thumbnail = patch.thumbnail;
  if (patch.color !== undefined)      dbPatch.color = patch.color;
  if (patch.textColor !== undefined)  dbPatch.text_color = patch.textColor;
  if (patch.linkedTaskId !== undefined) dbPatch.linked_task_id = patch.linkedTaskId;

  const { error } = await supabase.from('content_items').update(dbPatch).eq('id', id);
  if (error) throw new Error(`[contentService] updateContentItem: ${error.message}`);
}

export async function deleteContentItem(id: number): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('content_items').delete().eq('id', id);
  if (error) throw new Error(`[contentService] deleteContentItem: ${error.message}`);
}
