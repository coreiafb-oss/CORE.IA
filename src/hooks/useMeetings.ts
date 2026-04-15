/**
 * useMeetings — Hook especializado para o módulo Agendamento
 * Inclui Realtime para sincronização ao vivo das reuniões.
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import {
  fetchMeetings, createMeeting as createMeetingDB,
  deleteMeeting as deleteMeetingDB,
} from '../services';
import type { Meeting } from '../types';
import { initialMeetings } from '../data';

export function useMeetings() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ─── Carregamento inicial ──────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      try {
        const data = await fetchMeetings();
        if (!cancelled) {
          setMeetings(data.length > 0 ? data : initialMeetings);
        }
      } catch (err) {
        console.error('[useMeetings] Erro ao carregar:', err);
        if (!cancelled) {
          const saved = localStorage.getItem('line_os_meetings');
          setMeetings(saved ? JSON.parse(saved) : initialMeetings);
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
      .channel('meetings_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meetings' }, () => {
        fetchMeetings().then(data => {
          if (data.length > 0) setMeetings(data);
        }).catch(console.error);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // ─── Actions ──────────────────────────────────────────────────────────────
  const addMeeting = useCallback(async (meeting: Omit<Meeting, 'id'>) => {
    const tempId = Date.now();
    const optimistic: Meeting = { ...meeting, id: tempId };
    setMeetings(prev => [...prev, optimistic]);

    try {
      const saved = await createMeetingDB(meeting);
      setMeetings(prev => prev.map(m => m.id === tempId ? saved : m));
    } catch (err) {
      console.error('[useMeetings] addMeeting falhou:', err);
    }
  }, []);

  const removeMeeting = useCallback(async (id: number) => {
    setMeetings(prev => prev.filter(m => m.id !== id));
    try {
      await deleteMeetingDB(id);
    } catch (err) {
      console.error('[useMeetings] removeMeeting falhou:', err);
    }
  }, []);

  return {
    meetings, setMeetings,
    isLoading,
    addMeeting,
    deleteMeeting: removeMeeting,
  };
}
