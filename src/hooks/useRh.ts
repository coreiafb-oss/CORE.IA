import { useState, useEffect, useCallback } from 'react';
import { fetchRhProfiles, createRhProfile, deleteRhProfile, updateRhProfile, RhProfile } from '../services/rhService';

const initialTeam: RhProfile[] = [
  {
    id: '1', name: 'Arthur de Moraes', role: 'Diretor Criativo', type: 'Sócio',
    costPerHour: 150, costPerDay: 1200, phone: '+55 11 99999-9999', email: 'arthur@lineos.com', pix: '000.000.000-00', skills: ['Direção', 'Estratégia'], avatar: 'https://i.pravatar.cc/150?u=1'
  },
  {
    id: '2', name: 'Juliana Costa', role: 'Videomaker / Edição', type: 'Freelancer',
    costPerHour: 60, costPerDay: 500, phone: '+55 11 98888-8888', email: 'ju.video@gmail.com', pix: 'ju.video@gmail.com', skills: ['Captação', 'Premiere', 'After Effects'], avatar: 'https://i.pravatar.cc/150?u=2'
  }
];

export function useRh() {
  const [team, setTeam] = useState<RhProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await fetchRhProfiles();
        if (!cancelled) {
          setTeam(data.length > 0 ? data : initialTeam);
        }
      } catch (err) {
        console.error('[useRh] Erro ao carregar do Supabase:', err);
        if (!cancelled) {
          setTeam([]);
          alert('Erro ao carregar RH. Verifique a tabela rh_profiles no Supabase.');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const addProfile = useCallback(async (profile: Omit<RhProfile, 'id'>) => {
    const tempId = `temp-${Date.now()}`;
    setTeam(prev => [...prev, { ...profile, id: tempId }]);
    try {
      const saved = await createRhProfile(profile);
      setTeam(prev => prev.map(p => p.id === tempId ? saved : p));
    } catch (err) {
      console.error('[useRh] falha ao criar:', err);
      setTeam(prev => prev.filter(p => p.id !== tempId));
    }
  }, []);

  const updateProfile = useCallback(async (id: string, updates: Partial<Omit<RhProfile, 'id'>>) => {
    setTeam(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    try {
      await updateRhProfile(id, updates);
    } catch (err) {
      console.error('[useRh] falha ao atualizar:', err);
    }
  }, []);

  const removeProfile = useCallback(async (id: string) => {
    setTeam(prev => prev.filter(p => p.id !== id));
    try {
      await deleteRhProfile(id);
    } catch (err) {
      console.error('[useRh] falha ao deletar:', err);
    }
  }, []);

  return { team, isLoading, addProfile, updateProfile, removeProfile };
}
