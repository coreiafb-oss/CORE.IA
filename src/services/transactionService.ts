/**
 * Transaction Service — Acesso ao Supabase para o módulo Financeiro/DRE
 */
import { supabase } from '../lib/supabase';
import type { Transaction } from '../types';

function mapRowToTransaction(row: Record<string, unknown>): Transaction {
  return {
    id: row.id as number,
    title: row.title as string,
    category: row.category as string,
    date: row.date as string,
    amount: Number(row.amount),
    type: row.type as Transaction['type'],
  };
}

export async function fetchTransactions(): Promise<Transaction[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('date', { ascending: false });

  if (error) throw new Error(`[transactionService] fetchTransactions: ${error.message}`);
  return (data ?? []).map(row => mapRowToTransaction(row as Record<string, unknown>));
}

export async function createTransaction(
  tx: Omit<Transaction, 'id'>
): Promise<Transaction> {
  if (!supabase) throw new Error('[transactionService] Supabase não disponível');

  const { data, error } = await supabase
    .from('transactions')
    .insert({
      title: tx.title,
      category: tx.category,
      date: tx.date,
      amount: tx.amount,
      type: tx.type,
    })
    .select()
    .single();

  if (error) throw new Error(`[transactionService] createTransaction: ${error.message}`);
  return mapRowToTransaction(data as Record<string, unknown>);
}

export async function deleteTransaction(id: number): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) throw new Error(`[transactionService] deleteTransaction: ${error.message}`);
}

export interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  totalIncomeCount: number;
  totalExpenseCount: number;
}

export async function fetchFinancialSummary(): Promise<FinancialSummary | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('vw_financial_summary' as never)
    .select('*')
    .single();

  if (error || !data) return null;
  const row = data as Record<string, unknown>;
  return {
    totalRevenue: Number(row.total_revenue),
    totalExpenses: Number(row.total_expenses),
    netProfit: Number(row.net_profit),
    totalIncomeCount: Number(row.total_income_count),
    totalExpenseCount: Number(row.total_expense_count),
  };
}
