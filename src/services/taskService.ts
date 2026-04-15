/**
 * Task Service — Acesso direto ao Supabase para o módulo Gestor (Tasks)
 * Todas as funções são puras: sem state, sem efeitos colaterais.
 */
import { supabase } from '../lib/supabase';
import type { Task, Status, TaskComment, TaskAttachment } from '../types';

// ─── Mappers: DB Row → App Type ────────────────────────────────────────────────
function mapRowToTask(row: Record<string, unknown>): Task {
  return {
    id: row.id as string,
    name: row.name as string,
    description: row.description as string | undefined,
    statusId: row.status_id as string,
    assignees: (row.assignees as string[]) ?? [],
    dueDate: row.due_date as string | undefined,
    priority: row.priority as Task['priority'],
    tags: (row.tags as Task['tags']) ?? [],
    relatedTaskIds: (row.related_task_ids as string[]) ?? [],
    createdAt: row.created_at as string,
    comments: (row.task_comments as TaskComment[]) ?? [],
    attachments: (row.task_attachments as TaskAttachment[]) ?? [],
  };
}

function mapRowToStatus(row: Record<string, unknown>): Status {
  return {
    id: row.id as string,
    name: row.name as string,
    color: row.color as string,
  };
}

// ─── Status Operations ────────────────────────────────────────────────────────
export async function fetchTaskStatuses(): Promise<Status[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('task_statuses')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) throw new Error(`[taskService] fetchTaskStatuses: ${error.message}`);
  return (data ?? []).map(mapRowToStatus);
}

export async function createTaskStatus(status: Omit<Status, 'id'>): Promise<Status> {
  if (!supabase) throw new Error('[taskService] Supabase não disponível');
  const id = `s-${Date.now()}`;
  const { data, error } = await supabase
    .from('task_statuses')
    .insert({ id, name: status.name, color: status.color })
    .select()
    .single();

  if (error) throw new Error(`[taskService] createTaskStatus: ${error.message}`);
  return mapRowToStatus(data as Record<string, unknown>);
}

// ─── Task CRUD ────────────────────────────────────────────────────────────────
export async function fetchTasks(): Promise<Task[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) throw new Error(`[taskService] fetchTasks: ${error.message}`);
  return (data ?? []).map(row => mapRowToTask(row as Record<string, unknown>));
}

export async function createTask(task: Omit<Task, 'id' | 'createdAt' | 'comments' | 'attachments'>): Promise<Task> {
  if (!supabase) throw new Error('[taskService] Supabase não disponível');

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      name: task.name,
      description: task.description,
      status_id: task.statusId,
      assignees: task.assignees,
      due_date: task.dueDate,
      priority: task.priority,
      tags: (task.tags ?? []) as Record<string, unknown>[],
      related_task_ids: task.relatedTaskIds ?? [],
    })
    .select()
    .single();

  if (error) throw new Error(`[taskService] createTask: ${error.message}`);
  return mapRowToTask(data as Record<string, unknown>);
}

export async function updateTask(id: string, patch: Partial<Task>): Promise<void> {
  if (!supabase) return;

  const dbPatch: Record<string, unknown> = {};
  if (patch.name !== undefined)         dbPatch.name = patch.name;
  if (patch.description !== undefined)  dbPatch.description = patch.description;
  if (patch.statusId !== undefined)     dbPatch.status_id = patch.statusId;
  if (patch.assignees !== undefined)    dbPatch.assignees = patch.assignees;
  if (patch.dueDate !== undefined)      dbPatch.due_date = patch.dueDate;
  if (patch.priority !== undefined)     dbPatch.priority = patch.priority;
  if (patch.tags !== undefined)         dbPatch.tags = patch.tags as Record<string, unknown>[];
  if (patch.relatedTaskIds !== undefined) dbPatch.related_task_ids = patch.relatedTaskIds;

  const { error } = await supabase.from('tasks').update(dbPatch).eq('id', id);
  if (error) throw new Error(`[taskService] updateTask: ${error.message}`);
}

export async function deleteTask(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) throw new Error(`[taskService] deleteTask: ${error.message}`);
}

// ─── Comments ────────────────────────────────────────────────────────────────
export async function fetchTaskComments(taskId: string): Promise<TaskComment[]> {
  if (!supabase) return [];
  // Buscamos da tabela task_comments (a ser adicionada no schema patch)
  // Por ora, retorna array vazio se a tabela não existir ainda
  try {
    const { data, error } = await supabase
      .from('task_comments' as never)
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });

    if (error) return [];
    return ((data ?? []) as Record<string, unknown>[]).map(r => ({
      id: r.id as string,
      authorName: r.author_name as string,
      authorAvatar: r.author_avatar as string,
      content: r.content as string,
      createdAt: r.created_at as string,
    }));
  } catch {
    return [];
  }
}

export async function addTaskComment(
  taskId: string,
  comment: Omit<TaskComment, 'id' | 'createdAt'>
): Promise<TaskComment> {
  if (!supabase) {
    // Fallback: retorna objeto local sem persistir
    return {
      ...comment,
      id: `comment-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
  }

  try {
    const { data, error } = await supabase
      .from('task_comments' as never)
      .insert({
        task_id: taskId,
        author_name: comment.authorName,
        author_avatar: comment.authorAvatar,
        content: comment.content,
      })
      .select()
      .single();

    if (error) throw error;
    const row = data as Record<string, unknown>;
    return {
      id: row.id as string,
      authorName: row.author_name as string,
      authorAvatar: row.author_avatar as string,
      content: row.content as string,
      createdAt: row.created_at as string,
    };
  } catch {
    // Graceful degradation
    return {
      ...comment,
      id: `comment-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
  }
}
