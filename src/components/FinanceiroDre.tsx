import React, { useState, useMemo, useCallback } from 'react';
import { ArrowUpRight, ArrowDownRight, Wallet, Plus, TrendingUp, TrendingDown, X, Trash2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import useLocalStorage from '../hooks/useLocalStorage';
import useEscapeKey from '../hooks/useEscapeKey';
import { useToast } from './Toast';
import { useAppContext } from '../context/AppContext';
import { Modal } from './ui/Modal';

// ─── Helpers de Data ──────────────────────────────────────────────────────────
const toDisplayDate = (iso: string) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

const toIsoDate = (dateStr: string) => {
  if (!dateStr) return '';
  if (dateStr.includes('-')) return dateStr;
  const [d, m, y] = dateStr.split('/');
  return `${y}-${m}-${d}`;
};

// ─── Tipos ────────────────────────────────────────────────────────────────────
type TransactionType = 'income' | 'expense';

interface Transaction {
  id: number;
  title: string;
  category: string;
  date: string; // ISO: "2024-11-31"
  amount: number;
  type: TransactionType;
}

const today = new Date().toISOString().split('T')[0];

const initialTransactions: Transaction[] = [
  { id: 1, title: 'Fee Mensal - Loja XYZ', category: 'Fee Mensal', date: today, amount: 5000, type: 'income' },
  { id: 2, title: 'Meta Ads', category: 'Tráfego', date: today, amount: -2000, type: 'expense' },
  { id: 3, title: 'Software (Figma, Adobe)', category: 'Ferramentas', date: today, amount: -450, type: 'expense' },
];

// ─── Gráfico dinâmico ─────────────────────────────────────────────────────────
const buildChartData = (transactions: Transaction[]) => {
  const map: Record<string, { receitas: number; despesas: number }> = {};

  transactions.forEach((t) => {
    if (!t.date) return;
    const [year, month] = t.date.split('-');
    if (!year || !month) return;
    const key = `${year}-${month}`;
    if (!map[key]) map[key] = { receitas: 0, despesas: 0 };
    if (t.type === 'income') map[key].receitas += t.amount;
    else map[key].despesas += Math.abs(t.amount);
  });

  const sorted = Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6);

  if (sorted.length === 0) return [];

  return sorted.map(([key, vals]) => {
    const [year, month] = key.split('-');
    const name = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('pt-BR', { month: 'short' });
    return {
      name: name.charAt(0).toUpperCase() + name.slice(1),
      receitas: vals.receitas,
      despesas: vals.despesas,
    };
  });
};

// ─── Modal de Nova Transação ──────────────────────────────────────────────────
interface NovaTransacaoModalProps {
  onAdd: (tx: Transaction) => void;
  onClose: () => void;
}

const NovaTransacaoModal = ({ onAdd, onClose }: NovaTransacaoModalProps) => {
  const [form, setForm] = useState({
    title: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    amount: '',
    type: 'income' as TransactionType,
  });

  useEscapeKey(onClose);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseFloat(form.amount);
    if (!form.title.trim() || isNaN(value) || value <= 0) return;
    onAdd({
      id: Date.now(),
      title: form.title,
      category: form.category || 'Outros',
      date: form.date,
      amount: form.type === 'income' ? value : -value,
      type: form.type,
    });
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Nova Transação" maxWidth="max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo */}
          <div className="flex rounded-lg overflow-hidden border border-[#333]">
            {(['income', 'expense'] as TransactionType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setForm({ ...form, type: t })}
                className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                  form.type === t
                    ? t === 'income'
                      ? 'bg-green-600 text-white'
                      : 'bg-red-600 text-white'
                    : 'bg-[#0a0a0a] text-gray-400 hover:text-white'
                }`}
              >
                {t === 'income' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {t === 'income' ? 'Receita' : 'Despesa'}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Título</label>
            <input
              type="text"
              required
              autoFocus
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="Ex: Fee Mensal - Cliente ABC"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Categoria</label>
              <input
                type="text"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Ex: Tráfego"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Data</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors [color-scheme:dark]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Valor (R$)</label>
            <input
              type="number"
              required
              min="0.01"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="0,00"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors flex items-center gap-2 ${
                form.type === 'income' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              <Plus className="w-4 h-4" /> Adicionar
            </button>
          </div>
        </form>
    </Modal>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const FinanceiroDre = () => {
  const { transactions, setTransactions, addTransaction } = useAppContext();
  const [showModal, setShowModal] = useState(false);
  const { showToast, ToastContainer } = useToast();

  const handleAdd = (tx: Transaction) => {
    addTransaction(tx);
    setShowModal(false);
    showToast('Transação registrada', 'success');
  };

  const handleDelete = useCallback(
    (id: number) => {
      const deleted = transactions.find((t) => t.id === id);
      if (!deleted) return;
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      showToast(`"${deleted.title}" removida.`, () => {
        setTransactions((prev) => {
          const exists = prev.find((t) => t.id === id);
          if (exists) return prev;
          return [deleted, ...prev];
        });
      });
    },
    [transactions, setTransactions, showToast]
  );

  const totalReceitas = transactions
    .filter((t) => t.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);
  const totalDespesas = transactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, curr) => acc + Math.abs(curr.amount), 0);
  const lucroLiquido = totalReceitas - totalDespesas;
  const margem =
    totalReceitas > 0 ? ((lucroLiquido / totalReceitas) * 100).toFixed(1) : '0.0';

  const chartData = useMemo(() => buildChartData(transactions), [transactions]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 lg:p-8 h-full overflow-auto text-white"
      style={{ background: 'var(--surface-0)' }}
    >
      <div className="max-w-[1400px] mx-auto flex flex-col min-h-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-1 tracking-tight">Financeiro & DRE</h1>
            <p className="text-gray-400 text-sm">
              Acompanhe o fluxo de caixa e a saúde financeira da agência em tempo real.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-[13px] font-medium flex items-center gap-2 transition-all shadow-lg shadow-red-500/20"
          >
            <Plus className="w-4 h-4" /> Nova Transação
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          <motion.div
            whileHover={{ y: -2 }}
            className="bg-[#141414] border border-[#222] rounded-xl p-6 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-2xl -mr-10 -mt-10 transition-all group-hover:bg-green-500/10" />
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <ArrowUpRight className="w-5 h-5 text-green-500" />
              </div>
              <span className="text-xs font-medium text-green-500 bg-green-500/10 px-2 py-1 rounded-full flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> +{transactions.filter((t) => t.type === 'income').length} rec.
              </span>
            </div>
            <div className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wider">Total Receitas</div>
            <div className="text-3xl font-bold">
              R$ {totalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -2 }}
            className="bg-[#141414] border border-[#222] rounded-xl p-6 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-2xl -mr-10 -mt-10 transition-all group-hover:bg-red-500/10" />
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <ArrowDownRight className="w-5 h-5 text-red-500" />
              </div>
              <span className="text-xs font-medium text-red-500 bg-red-500/10 px-2 py-1 rounded-full flex items-center gap-1">
                <TrendingDown className="w-3 h-3" /> {transactions.filter((t) => t.type === 'expense').length} desp.
              </span>
            </div>
            <div className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wider">Total Despesas</div>
            <div className="text-3xl font-bold">
              R$ {totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -2 }}
            className="bg-[#141414] border border-[#222] rounded-xl p-6 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl -mr-10 -mt-10 transition-all group-hover:bg-blue-500/10" />
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-blue-500" />
              </div>
              <span
                className={`text-xs font-medium px-2 py-1 rounded-full border ${
                  lucroLiquido >= 0
                    ? 'text-blue-400 bg-blue-500/10 border-blue-500/20'
                    : 'text-red-400 bg-red-500/10 border-red-500/20'
                }`}
              >
                Margem: {margem}%
              </span>
            </div>
            <div className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wider">Lucro Líquido</div>
            <div className={`text-3xl font-bold ${lucroLiquido < 0 ? 'text-red-400' : ''}`}>
              R$ {lucroLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </motion.div>
        </div>

        {/* Chart + Transactions */}
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 bg-[#141414] border border-[#222] rounded-xl p-6">
            <h3 className="text-sm font-semibold mb-6">DRE — Evolução Mensal</h3>
            {chartData.length > 0 ? (
              <div className="h-[min(40vh,400px)] min-h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis
                      dataKey="name"
                      stroke="#666"
                      tick={{ fill: '#666', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="#666"
                      tick={{ fill: '#666', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `R$${v / 1000}k`}
                    />
                    <Tooltip
                      cursor={{ fill: '#222' }}
                      contentStyle={{
                        backgroundColor: '#1a1a1a',
                        border: '1px solid #333',
                        borderRadius: '8px',
                      }}
                      itemStyle={{ color: '#fff' }}
                      formatter={(v: number) => [
                        `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                        '',
                      ]}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                    <Bar dataKey="receitas" name="Receitas" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={30} />
                    <Bar dataKey="despesas" name="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[min(40vh,400px)] min-h-[300px] flex items-center justify-center text-gray-600 flex-col gap-2">
                <TrendingUp className="w-10 h-10 opacity-20" />
                <p className="text-sm">Adicione transações para ver o gráfico</p>
              </div>
            )}
          </div>

          <div className="bg-[#141414] border border-[#222] rounded-xl p-6 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-semibold">Últimas Transações</h3>
              <span className="text-xs text-gray-500">{transactions.length} registros</span>
            </div>

            <div className="space-y-3 flex-1 overflow-auto pr-1 custom-scrollbar">
              <AnimatePresence>
                {transactions.length === 0 && (
                  <div className="py-10 text-center text-gray-600 text-sm">
                    Nenhuma transação ainda.
                  </div>
                )}
                {transactions.map((t) => (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10, scale: 0.95 }}
                    className="flex items-center justify-between p-3 hover:bg-[#1a1a1a] rounded-lg transition-colors border border-transparent hover:border-[#333] group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                          t.type === 'income' ? 'bg-green-500/10' : 'bg-red-500/10'
                        }`}
                      >
                        {t.type === 'income' ? (
                          <ArrowUpRight className="w-3.5 h-3.5 text-green-500" />
                        ) : (
                          <ArrowDownRight className="w-3.5 h-3.5 text-red-500" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-medium truncate">{t.title}</div>
                        <div className="text-[10px] text-gray-500 truncate">
                          {t.category} • {toDisplayDate(t.date)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div
                        className={`text-xs font-semibold ${
                          t.type === 'income' ? 'text-green-500' : 'text-red-500'
                        }`}
                      >
                        {t.type === 'income' ? '+' : '-'}R${' '}
                        {Math.abs(t.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-600 hover:text-red-400"
                        title="Remover transação"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showModal && <NovaTransacaoModal onAdd={handleAdd} onClose={() => setShowModal(false)} />}
      </AnimatePresence>

      <ToastContainer />
    </motion.div>
  );
};

export default FinanceiroDre;
