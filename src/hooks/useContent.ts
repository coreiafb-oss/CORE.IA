/**
 * useContent — Hook especializado para o módulo Aprovação de Conteúdo
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import {
  fetchContentItems, createContentItem as createContentDB,
  updateContentItem, deleteContentItem,
} from '../services';
import type { ContentItem, ContentStatus } from '../types';
import { initialContent } from '../data';

export function useContent() {
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ─── Carregamento inicial ──────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      try {
        const data = await fetchContentItems();
        if (!cancelled) {
          setContentItems(data.length > 0 ? data : initialContent);
        }
      } catch (err) {
        console.error('[useContent] Erro ao carregar:', err);
        if (!cancelled) {
          const saved = localStorage.getItem('line_os_content');
          setContentItems(saved ? JSON.parse(saved) : initialContent);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  // ─── Realtime ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!supabase) return;
    const channel = supabase
      .channel('content_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'content_items' }, () => {
        fetchContentItems().then(data => {
          if (data.length > 0) setContentItems(data);
        }).catch(console.error);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // ─── Actions ──────────────────────────────────────────────────────────────
  const addContentItem = useCallback(async (item: Omit<ContentItem, 'id'>) => {
    const tempId = Date.now();
    const optimistic = { ...item, id: tempId };
    setContentItems(prev => [optimistic, ...prev]);

    try {
      const saved = await createContentDB(item);
      setContentItems(prev => prev.map(i => i.id === tempId ? saved : i));
    } catch (err) {
      console.error('[useContent] addContentItem falhou:', err);
    }
  }, []);

  const editContentItem = useCallback(async (id: number, updates: Partial<Omit<ContentItem, 'id'>>) => {
    setContentItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
    try {
      await updateContentItem(id, updates);
    } catch (err) {
      console.error('[useContent] editContentItem falhou:', err);
    }
  }, []);

  const updateStatus = useCallback(async (id: number, status: ContentStatus, feedback?: string | null) => {
    setContentItems(prev => prev.map(i =>
      i.id === id ? { ...i, status, ...(feedback !== undefined ? { feedback } : {}) } : i
    ));
    try {
      await updateContentItem(id, { status, ...(feedback !== undefined ? { feedback } : {}) });
    } catch (err) {
      console.error('[useContent] updateStatus falhou:', err);
    }
  }, []);

  const removeContentItem = useCallback(async (id: number) => {
    setContentItems(prev => prev.filter(i => i.id !== id));
    try {
      await deleteContentItem(id);
    } catch (err) {
      console.error('[useContent] removeContentItem falhou:', err);
    }
  }, []);

  return {
    contentItems, setContentItems,
    isLoading,
    addContentItem,
    updateContentItem: editContentItem,
    updateContentStatus: updateStatus,
    deleteContentItem: removeContentItem,
  };
}
