/**
 * useClients — Hook especializado para o módulo de Clientes
 */
import { useState, useEffect, useCallback } from 'react';
import {
  fetchClients, createClient as createClientDB,
  updateClient as updateClientDB, deleteClient as deleteClientDB,
  fetchClientStatuses,
} from '../services';
import type { Client, ClientStatus } from '../types';
import { clients as initialClients, clientStatuses as initialClientStatuses } from '../data';

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [clientStatuses, setClientStatuses] = useState<ClientStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ─── Carregamento inicial ──────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      try {
        const [clientsData, statusesData] = await Promise.all([
          fetchClients(),
          fetchClientStatuses(),
        ]);
        if (!cancelled) {
          setClients(clientsData.length > 0 ? clientsData : initialClients);
          setClientStatuses(statusesData.length > 0 ? statusesData : initialClientStatuses);
        }
      } catch (err) {
        console.error('[useClients] Erro ao carregar:', err);
        if (!cancelled) {
          const savedC = localStorage.getItem('line_os_clients');
          const savedS = localStorage.getItem('line_os_client_statuses');
          setClients(savedC ? JSON.parse(savedC) : initialClients);
          setClientStatuses(savedS ? JSON.parse(savedS) : initialClientStatuses);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  // ─── Actions ──────────────────────────────────────────────────────────────
  const addClient = useCallback(async (client: Omit<Client, 'id'>) => {
    const tempId = `client-${Date.now()}`;
    const optimistic: Client = { ...client, id: tempId };
    setClients(prev => [...prev, optimistic]);

    try {
      const saved = await createClientDB(client);
      setClients(prev => prev.map(c => c.id === tempId ? saved : c));
    } catch (err) {
      console.error('[useClients] addClient falhou:', err);
    }
  }, []);

  const editClient = useCallback(async (clientId: string, updates: Partial<Client>) => {
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, ...updates } : c));
    try {
      await updateClientDB(clientId, updates);
    } catch (err) {
      console.error('[useClients] editClient falhou:', err);
    }
  }, []);

  const removeClient = useCallback(async (clientId: string) => {
    setClients(prev => prev.filter(c => c.id !== clientId));
    try {
      await deleteClientDB(clientId);
    } catch (err) {
      console.error('[useClients] removeClient falhou:', err);
    }
  }, []);

  return {
    clients, setClients,
    clientStatuses, setClientStatuses,
    isLoading,
    addClient,
    updateClient: editClient,
    deleteClient: removeClient,
  };
}
