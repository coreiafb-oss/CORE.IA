import React, { useState, useCallback } from 'react';
import {
  Plus, TrendingUp, DollarSign, MoreHorizontal, Building2,
  Calendar, DollarSign as DollarIcon, X, Trash2, Clock, MessageCircle
} from 'lucide-react';
import {
  DndContext, closestCorners, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragOverlay, DragStartEvent, DragOverEvent, DragEndEvent, useDroppable
} from '@dnd-kit/core';
import {
  SortableContext, arrayMove, sortableKeyboardCoordinates,
  verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'motion/react';
import useEscapeKey from '../hooks/useEscapeKey';
import { useToast } from './Toast';
import { useAppContext } from '../context/AppContext';
import { Modal } from './ui/Modal';
import { LeadDrawer } from './LeadDrawer';

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface Column {
  id: string;
  title: string;
  color: string;
  accent: string;
}

import type { Lead } from '../types';

const initialColumns: Column[] = [
  { id: 'leads',    title: 'Leads',             color: 'bg-blue-500',   accent: 'blue'   },
  { id: 'agendada', title: 'Reunião Agendada',   color: 'bg-primary', accent: 'purple' },
  { id: 'proposta', title: 'Proposta Enviada',   color: 'bg-orange-500', accent: 'orange' },
  { id: 'ganho',    title: 'Fechado (Ganho)',    color: 'bg-green-500',  accent: 'green'  },
  { id: 'perdido',  title: 'Perdido',            color: 'bg-red-500',    accent: 'red'    },
];

const today = new Date().toISOString().split('T')[0];

const initialItems: Lead[] = [
  { id: '1', columnId: 'agendada', title: 'TechCorp Solutions', value: 15000, date: today },
  { id: '2', columnId: 'agendada', title: 'EducaMais EAD',       value: 8500,  date: today },
  { id: '3', columnId: 'agendada', title: 'Clinica Sorriso',     value: 5000,  date: today },
  { id: '4', columnId: 'leads',    title: 'Nova Startup XYZ',    value: 12000, date: today },
  { id: '5', columnId: 'proposta', title: 'Indústria ABC',       value: 35000, date: today },
];

const toDisplayDate = (iso: string) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

// ─── Modal Novo Lead ──────────────────────────────────────────────────────────
interface NovoLeadModalProps {
  onAdd: (lead: Lead) => void;
  onClose: () => void;
  columns: Column[];
}

const NovoLeadModal = ({ onAdd, onClose, columns }: NovoLeadModalProps) => {
  const [form, setForm] = useState({
    title: '',
    value: '',
    columnId: 'leads',
    date: new Date().toISOString().split('T')[0],
  });

  useEscapeKey(onClose);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseFloat(form.value);
    if (!form.title.trim() || isNaN(value)) return;
    onAdd({
      columnId: form.columnId,
      title: form.title,
      value,
      date: form.date,
    } as any);
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Novo Lead" maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <label className="block text-xs text-gray-400 mb-1">Empresa / Lead</label>
            <input
              type="text"
              required
              autoFocus
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="Ex: Empresa ABC"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Valor (R$)</label>
              <input
                type="number"
                required
                min="0"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="0,00"
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
            <label className="block text-xs text-gray-400 mb-1">Estágio</label>
            <select
              value={form.columnId}
              onChange={(e) => setForm({ ...form, columnId: e.target.value })}
              className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
            >
              {columns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
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
              className="bg-gradient-to-r from-primary to-blue-500 hover:from-blue-700 hover:to-primary text-white px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Adicionar Lead
            </button>
          </div>
        </form>
    </Modal>
  );
};

// ─── Sortable Card ────────────────────────────────────────────────────────────
const getDaysSinceContact = (lead: Lead) => {
  const dates = lead.activities?.map((a) => new Date(a.date).getTime()) || [];
  const lastContactMs = dates.length ? Math.max(...dates) : new Date(lead.date || Date.now()).getTime();
  const diff = (Date.now() - lastContactMs) / (1000 * 60 * 60 * 24);
  return Math.floor(Math.max(0, diff));
};

interface SortableItemProps {
  key?: string | number;
  id: string;
  item: Lead;
  onDelete: (id: string) => void;
  onClick: (item: Lead) => void;
}

const SortableItem = ({ id, item, onDelete, onClick }: SortableItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    touchAction: 'none',
  };

  const days = getDaysSinceContact(item);
  const diasStr = days === 0 ? 'Hoje' : days === 1 ? 'Ontem' : `${days}d atrás`;
  const cleanPhone = item.phone?.replace(/\D/g, '');
  const waLink = cleanPhone ? `https://wa.me/55${cleanPhone}` : null;

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, background: 'var(--surface-2)', border: '1px solid var(--border-subtle)' }}
      {...attributes}
      {...listeners}
      onClick={() => onClick(item)}
      className="rounded-xl p-3 flex flex-col gap-3 cursor-grab active:cursor-grabbing transition-all duration-150 group hover:brightness-110 relative"
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-medium text-sm flex items-start gap-2 text-white">
          <div className="w-6 h-6 rounded bg-[#222] flex items-center justify-center text-gray-400 group-hover:text-white transition-colors flex-shrink-0 mt-0.5">
            <Building2 className="w-3 h-3" />
          </div>
          <span className="flex-1 break-words line-clamp-2 leading-tight pr-4">{item.title}</span>
        </h4>
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onDelete(id); }}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-red-400 shrink-0"
          title="Remover lead"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-y-2 mt-auto">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded border border-green-500/20 flex items-center gap-1">
            <DollarIcon className="w-3 h-3" /> {item.value.toLocaleString('pt-BR')}
          </span>
          <span className="text-[10px] text-gray-400 flex items-center gap-1 bg-[#222] px-1.5 py-0.5 rounded" title="Último contato">
            <Clock className="w-3 h-3 text-orange-500/80" /> {diasStr}
          </span>
        </div>
        
        {waLink && (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-1 rounded transition-colors"
            title="Enviar mensagem no WhatsApp"
          >
            <MessageCircle className="w-3 h-3" /> Chamar
          </a>
        )}
      </div>
    </div>
  );
};

// ─── Droppable Column Wrapper ─────────────────────────────────────────────────
const DroppableColumn = ({ col, children, isOver }: any) => {
  const { setNodeRef } = useDroppable({ id: col.id });
  return (
    <div
      className={`w-[clamp(240px,20vw,320px)] flex-shrink-0 flex flex-col gap-3 h-full rounded-xl transition-all duration-200 ${
        isOver ? 'ring-2 ring-blue-500/50 bg-blue-500/5' : ''
      }`}
    >
      {children(setNodeRef)}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const CrmVendas = () => {
  const { leads: items, setLeads: setItems, updateLeadStatus, addLead, updateLeadDetails } = useAppContext();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [originalColumnId, setOriginalColumnId] = useState<string | null>(null);
  const [overColumnId, setOverColumnId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [drawerLead, setDrawerLead] = useState<Lead | null>(null);
  const { showToast, ToastContainer } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    const item = items.find((i) => i.id === event.active.id);
    if (item) setOriginalColumnId(item.columnId);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) { setOverColumnId(null); return; }
    const activeItemId = active.id as string;
    const overId = over.id as string;
    if (activeItemId === overId) return;

    const isOverColumn = initialColumns.some((col) => col.id === overId);
    if (isOverColumn) {
      setOverColumnId(overId);
      setItems((prev) =>
        prev.map((item) =>
          item.id === activeItemId ? { ...item, columnId: overId } : item
        )
      );
    } else {
      const overItem = items.find((i) => i.id === overId);
      if (overItem) setOverColumnId(overItem.columnId);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setOverColumnId(null);
    
    if (!over) {
      // Reverter se foi solto fora
      if (originalColumnId) {
        setItems(prev => prev.map(i => i.id === active.id ? { ...i, columnId: originalColumnId } : i));
      }
      setOriginalColumnId(null);
      return;
    }

    const activeItemId = active.id as string;
    const overId = over.id as string;
    const activeItem = items.find((item) => item.id === activeItemId);
    const overItem = items.find((item) => item.id === overId);
    
    if (!activeItem) return;

    let targetColumnId = originalColumnId;

    if (overItem && originalColumnId === overItem.columnId) {
      setItems((prev) => {
        const oldIndex = prev.findIndex((item) => item.id === activeItemId);
        const newIndex = prev.findIndex((item) => item.id === overId);
        return arrayMove(prev, oldIndex, newIndex);
      });
    } else if (overItem) {
      targetColumnId = overItem.columnId;
    } else {
      const isOverColumn = initialColumns.some((col) => col.id === overId);
      if (isOverColumn) {
        targetColumnId = overId;
      }
    }

    // Usar o AppContext para lidar com trigger financeiro caso realmente tenha mudado de coluna
    if (targetColumnId && targetColumnId !== originalColumnId) {
       // Restauramos a coluna original localmente (pra despistar trigger incorreto duplo)
       setItems((prev) => prev.map((item) => item.id === activeItemId ? { ...item, columnId: originalColumnId } : item));
       // Deixamos a fonte da verdade fazer o update oficial
       updateLeadStatus(activeItemId, targetColumnId);
       
       if (targetColumnId === 'ganho') {
         showToast(`O lead "${activeItem.title}" foi fechado! 🎉 Receita gerada.`, 'success');
       }
    } else {
       // Apenas salva a ordem
       setItems((prev) => prev.map((item) => item.id === activeItemId ? { ...item, columnId: targetColumnId! } : item));
    }
    
    setOriginalColumnId(null);
  };

  const handleDelete = useCallback(
    (id: string) => {
      const deleted = items.find((i) => i.id === id);
      if (!deleted) return;
      setItems((prev) => prev.filter((i) => i.id !== id));
      showToast(`"${deleted.title}" removido.`, () => {
        setItems((prev) => {
          const exists = prev.find((i) => i.id === id);
          if (exists) return prev;
          return [...prev, deleted];
        });
      });
    },
    [items, setItems, showToast]
  );

  const handleAddLead = (lead: Lead) => {
    setItems((prev) => [...prev, lead]);
    setShowModal(false);
  };

  const activeItem = activeId ? items.find((item) => item.id === activeId) : null;
  const pipelineAtivo = items
    .filter((i) => i.columnId !== 'ganho' && i.columnId !== 'perdido')
    .reduce((acc, curr) => acc + curr.value, 0);
  const fechadoMes = items
    .filter((i) => i.columnId === 'ganho')
    .reduce((acc, curr) => acc + curr.value, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 lg:p-8 h-full flex flex-col text-white overflow-hidden"
      style={{ background: 'var(--surface-0)' }}
    >
      <div className="max-w-[1400px] mx-auto w-full flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-shrink-0">
          <div>
            <h1 className="text-2xl font-bold mb-1 tracking-tight">CRM & Vendas</h1>
            <p className="text-gray-400 text-sm">
              Gerencie seu pipeline de vendas.{' '}
              <span className="text-red-500">Vendas ganhas geram receita automática no Financeiro.</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-lg px-4 py-2 flex items-center gap-3" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)' }}>
              <div className="w-7 h-7 rounded bg-red-500/15 flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5 text-red-400" />
              </div>
              <div>
                <div className="text-[10px] text-gray-500 font-medium uppercase">Pipeline Ativo</div>
                <div className="font-bold text-sm">
                  R$ {pipelineAtivo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
            <div className="rounded-lg px-4 py-2 flex items-center gap-3" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)' }}>
              <div className="w-7 h-7 rounded bg-emerald-500/15 flex items-center justify-center">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div>
                <div className="text-[10px] text-gray-500 font-medium uppercase">Fechado (Mês)</div>
                <div className="font-bold text-sm">
                  R$ {fechadoMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-[13px] font-medium flex items-center gap-2 transition-all shadow-lg shadow-red-500/20"
            >
              <Plus className="w-4 h-4" /> Novo Lead
            </button>
          </div>
        </div>

        {/* Board */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar pb-4">
          <div className="flex gap-4 h-full" style={{ minWidth: `${initialColumns.length * 290}px` }}>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            >
              {initialColumns.map((col) => {
                const columnItems = items.filter((item) => item.columnId === col.id);
                const columnTotal = columnItems.reduce((acc, curr) => acc + curr.value, 0);
                const isOver = overColumnId === col.id && activeId !== null;
                return (
                  <DroppableColumn key={col.id} col={col} isOver={isOver}>
                    {(setNodeRef: any) => (
                      <>
                        <div className="flex items-center justify-between px-1 flex-shrink-0">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${col.color}`} />
                            <span className="font-semibold text-[13px]">{col.title}</span>
                            <span className="text-[10px] font-bold bg-[#222] px-1.5 py-0.5 rounded text-gray-400">
                              {columnItems.length}
                            </span>
                          </div>
                          <button className="p-1 hover:bg-[#222] rounded text-gray-600 hover:text-white transition-colors">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="text-[11px] text-gray-500 px-1 font-medium flex-shrink-0">
                          R$ {columnTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>

                        <div
                          ref={setNodeRef}
                          id={col.id}
                          className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-3 pb-2 px-px pt-2"
                        >
                          <SortableContext
                            items={columnItems.map((i) => i.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            {columnItems.map((item) => (
                              <SortableItem
                                key={item.id}
                                id={item.id}
                                item={item}
                                onDelete={handleDelete}
                                onClick={(lead) => setDrawerLead(lead)}
                              />
                            ))}
                          </SortableContext>

                          {columnItems.length === 0 && !isOver && (
                            <div className="flex flex-col items-center justify-center text-gray-600 text-xs py-10 opacity-60">
                              <div className="w-10 h-10 border border-dashed border-[#333] rounded-full flex items-center justify-center mb-2">
                                +
                              </div>
                              Solte um lead aqui
                            </div>
                          )}

                          <button
                            onClick={() => setShowModal(true)}
                            className="w-full mt-2 py-2.5 rounded-lg border border-dashed border-[#333] text-gray-600 hover:text-gray-300 hover:border-[#444] hover:bg-[#141414] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all outline-none focus:outline-none shrink-0"
                          >
                            <Plus className="w-3.5 h-3.5" /> Adicionar Lead
                          </button>
                        </div>
                      </>
                    )}
                  </DroppableColumn>
                );
              })}

              <DragOverlay>
                {activeItem ? (
                  <div className="bg-[#1c1c1c] border border-[#444] rounded-xl p-4 shadow-2xl rotate-2 scale-105 w-[clamp(240px,20vw,320px)]">
                    <h4 className="font-medium text-sm mb-3 flex items-center gap-2 text-white">
                      <div className="w-6 h-6 rounded bg-[#333] flex items-center justify-center text-white">
                        <Building2 className="w-3 h-3" />
                      </div>
                      {activeItem.title}
                    </h4>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-green-500 bg-green-500/10 px-2 py-1 rounded border border-green-500/20 flex items-center gap-1">
                        <DollarIcon className="w-3 h-3" /> {activeItem.value.toLocaleString('pt-BR')}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {toDisplayDate(activeItem.date)}
                      </span>
                    </div>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <NovoLeadModal
            onAdd={(lead) => {
              addLead(lead);
              setShowModal(false);
              showToast('Lead adicionado', 'success');
            }}
            onClose={() => setShowModal(false)}
            columns={initialColumns}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {drawerLead && (
          <LeadDrawer
            isOpen={!!drawerLead}
            onClose={() => setDrawerLead(null)}
            lead={drawerLead}
            onUpdate={(id, updates) => {
              updateLeadDetails(id, updates);
              // Also update the local state to reflect changes instantly in the drawer view
              setDrawerLead(prev => prev ? { ...prev, ...updates } : null);
            }}
          />
        )}
      </AnimatePresence>

      <ToastContainer />
    </motion.div>
  );
};

export default CrmVendas;
