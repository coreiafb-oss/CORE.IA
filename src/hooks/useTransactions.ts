/**
 * useTransactions — Hook para o módulo Financeiro/DRE
 */
import { useState, useEffect, useCallback } from 'react';
import {
  fetchTransactions, createTransaction as createTxDB,
  deleteTransaction as deleteTxDB, fetchFinancialSummary,
} from '../services';
import type { Transaction } from '../types';
import { transactions as initialTransactions } from '../data';
import type { FinancialSummary } from '../services/transactionService';

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ─── Carregamento inicial ──────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      try {
        const [txData, summaryData] = await Promise.all([
          fetchTransactions(),
          fetchFinancialSummary(),
        ]);
        if (!cancelled) {
          setTransactions(txData.length > 0 ? txData : initialTransactions);
          setSummary(summaryData);
        }
      } catch (err) {
        console.error('[useTransactions] Erro ao carregar:', err);
        if (!cancelled) {
          const saved = localStorage.getItem('line_os_transactions');
          setTransactions(saved ? JSON.parse(saved) : initialTransactions);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  // ─── Actions ──────────────────────────────────────────────────────────────
  const addTransaction = useCallback(async (tx: Omit<Transaction, 'id'>) => {
    const tempId = Date.now();
    const optimistic = { ...tx, id: tempId };
    setTransactions(prev => [optimistic, ...prev]);

    try {
      const saved = await createTxDB(tx);
      setTransactions(prev => prev.map(t => t.id === tempId ? saved : t));
      // Atualizar resumo financeiro
      fetchFinancialSummary().then(s => { if (s) setSummary(s); }).catch(() => {});
    } catch (err) {
      console.error('[useTransactions] addTransaction falhou:', err);
    }
  }, []);

  const deleteTransaction = useCallback(async (id: number) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    try {
      await deleteTxDB(id);
      fetchFinancialSummary().then(s => { if (s) setSummary(s); }).catch(() => {});
    } catch (err) {
      console.error('[useTransactions] deleteTransaction falhou:', err);
    }
  }, []);

  return {
    transactions, setTransactions,
    summary,
    isLoading,
    addTransaction,
    deleteTransaction,
  };
}
