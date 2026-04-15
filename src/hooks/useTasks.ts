/**
 * useTasks — Hook especializado para o módulo Gestor (Tasks)
 * Responsável por: estado, Realtime, automations engine e todas as actions.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import {
  fetchTasks, createTask, updateTask, deleteTask,
  fetchTaskStatuses, createTaskStatus, addTaskComment,
} from '../services';
import type {
  Task, Status, Automation, TaskComment, TaskAttachment,
} from '../types';
import {
  tasks as initialTasks,
  statuses as initialStatuses,
} from '../data';

// Automações padrão (config de UI — mantidas no hook/localStorage)
const DEFAULT_AUTOMATIONS: Automation[] = [
  {
    id: 'auto-1',
    name: 'Pendente → Revisão: trocar responsável',
    trigger: { type: 'status_change', fromStatusId: 's1', toStatusId: 's2' },
    actions: [
      { type: 'remove_assignee', assigneeId: 'u1' },
      { type: 'add_assignee', assigneeId: 'u2', displayName: 'Lucas', avatar: 'https://i.pravatar.cc/150?img=33' },
    ],
    isActive: true,
  },
];

function loadAutomations(): Automation[] {
  try {
    const saved = localStorage.getItem('line_os_automations');
    return saved ? JSON.parse(saved) : DEFAULT_AUTOMATIONS;
  } catch {
    return DEFAULT_AUTOMATIONS;
  }
}

export function useTasks(userFullName?: string, userAvatar?: string) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskStatuses, setTaskStatuses] = useState<Status[]>([]);
  const [automations, setAutomations] = useState<Automation[]>(loadAutomations);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Guardar ref das automations para usar em callbacks sem stale closure
  const automationsRef = useRef(automations);
  automationsRef.current = automations;

  // ─── Persistência de automações (config de UI) ─────────────────────────────
  useEffect(() => {
    localStorage.setItem('line_os_automations', JSON.stringify(automations));
  }, [automations]);

  // ─── Carregamento inicial ──────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [tasksData, statusesData] = await Promise.all([
          fetchTasks(),
          fetchTaskStatuses(),
        ]);
        if (cancelled) return;

        // Fallback para dados locais se Supabase não disponível
        setTasks(tasksData.length > 0 ? tasksData : initialTasks.map(t => ({
          ...t, createdAt: new Date().toISOString(), comments: [], attachments: []
        })));
        setTaskStatuses(statusesData.length > 0 ? statusesData : initialStatuses);
      } catch (err) {
        if (cancelled) return;
        console.error('[useTasks] Erro ao carregar:', err);
        setError('Falha ao conectar com o banco de dados. Usando dados locais.');
        // Fallback gracioso
        const savedTasks = localStorage.getItem('line_os_tasks_v2');
        const savedStatuses = localStorage.getItem('line_os_task_statuses');
        setTasks(savedTasks ? JSON.parse(savedTasks) : initialTasks.map(t => ({
          ...t, createdAt: new Date().toISOString(), comments: [], attachments: []
        })));
        setTaskStatuses(savedStatuses ? JSON.parse(savedStatuses) : initialStatuses);
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
      .channel('tasks_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        fetchTasks().then(data => {
          if (data.length > 0) setTasks(data);
        }).catch(console.error);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // ─── Automation Engine ─────────────────────────────────────────────────────
  const runAutomations = useCallback((taskId: string, fromStatusId: string, toStatusId: string) => {
    const activeAutomations = automationsRef.current.filter(a => a.isActive);
    const matching = activeAutomations.filter(a => {
      const fromMatch = a.trigger.fromStatusId === '*' || a.trigger.fromStatusId === fromStatusId;
      return fromMatch && a.trigger.toStatusId === toStatusId;
    });

    if (matching.length === 0) return;

    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      let updated = { ...t };
      matching.forEach(automation => {
        automation.actions.forEach(action => {
          switch (action.type) {
            case 'remove_assignee':
              updated = { ...updated, assignees: updated.assignees.filter(a => a !== action.assigneeId) };
              break;
            case 'add_assignee':
              if (!updated.assignees.includes(action.avatar)) {
                updated = { ...updated, assignees: [...updated.assignees, action.avatar] };
              }
              break;
            case 'set_priority':
              updated = { ...updated, priority: action.priority };
              break;
            case 'set_status':
              updated = { ...updated, statusId: action.statusId };
              break;
          }
        });
      });
      return updated;
    }));
  }, []);

  // ─── Task Actions ──────────────────────────────────────────────────────────
  const addTask = useCallback(async (task: Omit<Task, 'id' | 'createdAt' | 'comments' | 'attachments'>) => {
    // Optimistic update
    const tempId = `task-${Date.now()}`;
    const optimistic: Task = {
      ...task,
      id: tempId,
      createdAt: new Date().toISOString(),
      comments: [],
      attachments: [],
    };
    setTasks(prev => [...prev, optimistic]);

    try {
      const saved = await createTask(task);
      setTasks(prev => prev.map(t => t.id === tempId ? saved : t));
    } catch (err) {
      console.error('[useTasks] addTask falhou, mantendo otimista:', err);
      // Persiste localmente o fallback
      setTasks(prev => {
        localStorage.setItem('line_os_tasks_v2', JSON.stringify(prev));
        return prev;
      });
    }
  }, []);

  const editTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    setTasks(prev => {
      const oldTask = prev.find(t => t.id === taskId);
      if (!oldTask) return prev;

      // Disparar automações se status mudou
      if (updates.statusId && updates.statusId !== oldTask.statusId) {
        setTimeout(() => runAutomations(taskId, oldTask.statusId, updates.statusId!), 50);
      }

      return prev.map(t => t.id === taskId ? { ...t, ...updates } : t);
    });

    try {
      await updateTask(taskId, updates);
    } catch (err) {
      console.error('[useTasks] updateTask falhou:', err);
    }
  }, [runAutomations]);

  const removeTask = useCallback(async (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    try {
      await deleteTask(taskId);
    } catch (err) {
      console.error('[useTasks] deleteTask falhou:', err);
    }
  }, []);

  const addComment = useCallback(async (taskId: string, content: string) => {
    const comment: TaskComment = {
      id: `comment-${Date.now()}`,
      authorName: userFullName ?? 'Usuário',
      authorAvatar: userAvatar ?? 'https://i.pravatar.cc/150?img=11',
      content,
      createdAt: new Date().toISOString(),
    };

    // Optimistic update
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, comments: [...(t.comments ?? []), comment] } : t
    ));

    try {
      const saved = await addTaskComment(taskId, {
        authorName: comment.authorName,
        authorAvatar: comment.authorAvatar,
        content,
      });
      setTasks(prev => prev.map(t => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          comments: (t.comments ?? []).map(c => c.id === comment.id ? saved : c),
        };
      }));
    } catch (err) {
      console.error('[useTasks] addComment falhou:', err);
    }
  }, [userFullName, userAvatar]);

  const addAttachment = useCallback((taskId: string, attachment: Omit<TaskAttachment, 'id' | 'uploadedAt'>) => {
    const newAttachment: TaskAttachment = {
      ...attachment,
      id: `att-${Date.now()}`,
      uploadedAt: new Date().toISOString(),
    };
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, attachments: [...(t.attachments ?? []), newAttachment] } : t
    ));
  }, []);

  const removeAttachment = useCallback((taskId: string, attachmentId: string) => {
    setTasks(prev => prev.map(t =>
      t.id === taskId
        ? { ...t, attachments: (t.attachments ?? []).filter(a => a.id !== attachmentId) }
        : t
    ));
  }, []);

  const addTaskStatus = useCallback(async (status: Omit<Status, 'id'>) => {
    const tempId = `s-${Date.now()}`;
    const optimistic: Status = { ...status, id: tempId };
    setTaskStatuses(prev => [...prev, optimistic]);

    try {
      const saved = await createTaskStatus(status);
      setTaskStatuses(prev => prev.map(s => s.id === tempId ? saved : s));
    } catch (err) {
      console.error('[useTasks] addTaskStatus falhou:', err);
    }
  }, []);

  return {
    tasks, setTasks,
    taskStatuses, setTaskStatuses,
    automations, setAutomations,
    isLoading,
    error,
    // Actions
    addTask,
    updateTask: editTask,
    deleteTask: removeTask,
    addComment,
    addAttachment,
    removeAttachment,
    addTaskStatus,
  };
}
