import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, Users, Video, X, ArrowRight, RefreshCw, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../context/AppContext';
import { Meeting } from '../types';
import useEscapeKey from '../hooks/useEscapeKey';

interface EventModalProps {
  onAdd: (meeting: Omit<Meeting, 'id'>) => void;
  onClose: () => void;
  initialDate?: string;
}

export const EventModal = ({ onAdd, onClose, initialDate }: EventModalProps) => {
  const { leads } = useAppContext();
  const [form, setForm] = useState({
    title: '',
    date: initialDate || new Date().toISOString().split('T')[0],
    time: '14:00',
    duration: '60',
    client: '',
    platform: 'Google Meet'
  });
  const [syncGcal, setSyncGcal] = useState(false);

  useEscapeKey(onClose, true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.date || !form.time) return;

    const [hours, mins] = form.time.split(':').map(Number);
    const end = new Date(0, 0, 0, hours, mins + parseInt(form.duration));
    const timeStr = `${form.time} - ${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`;
    const isToday = form.date === new Date().toISOString().split('T')[0];

    // Aqui poderia ocorrer a lógica de integração GCal:
    // se syncGcal === true, dispara API do Google.

    onAdd({
      title: form.title,
      date: form.date,
      time: timeStr,
      client: form.client || 'Interno',
      platform: form.platform,
      isToday
    });
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-2xl bg-[#141414] border border-[#333] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between p-6 border-b border-[#2b2b2b]">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                <CalendarIcon className="w-5 h-5 text-orange-500" />
             </div>
             <div>
               <h2 className="text-xl font-bold text-white tracking-tight">Novo Agendamento</h2>
               <p className="text-sm text-gray-500 mt-0.5">Preencha os detalhes do seu compromisso.</p>
             </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white bg-[#1e1e1e] hover:bg-[#2b2b2b] rounded-lg transition-colors border border-[#333]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          <div className="space-y-4">
            {/* Título */}
            <div className="group">
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider group-focus-within:text-orange-500 transition-colors">Assunto / Título</label>
              <input
                type="text" required autoFocus
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                className="w-full bg-[#1e1e1e] border border-[#333] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
                placeholder="Ex: Kickoff com Diretoria"
              />
            </div>

            {/* Data e Hora */}
            <div className="grid grid-cols-2 gap-4">
              <div className="group">
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider group-focus-within:text-orange-500 transition-colors">Data</label>
                <input
                  type="date" required
                  value={form.date}
                  onChange={e => setForm({ ...form, date: e.target.value })}
                  className="w-full bg-[#1e1e1e] border border-[#333] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors [color-scheme:dark]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="group">
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider group-focus-within:text-orange-500 transition-colors">Hora</label>
                  <input
                    type="time" required
                    value={form.time}
                    onChange={e => setForm({ ...form, time: e.target.value })}
                    className="w-full bg-[#1e1e1e] border border-[#333] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors [color-scheme:dark]"
                  />
                </div>
                <div className="group">
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider group-focus-within:text-orange-500 transition-colors">Duração</label>
                  <select
                    value={form.duration}
                    onChange={e => setForm({ ...form, duration: e.target.value })}
                    className="w-full bg-[#1e1e1e] border border-[#333] rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors appearance-none cursor-pointer"
                  >
                    <option value="15">15 min</option>
                    <option value="30">30 min</option>
                    <option value="60">1 H</option>
                    <option value="90">1.5 H</option>
                    <option value="120">2 H</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Cliente (Link CRM) e Plataforma */}
            <div className="p-4 rounded-xl bg-[#0a0a0a] border border-[#2b2b2b] space-y-4">
              <div className="group">
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider group-focus-within:text-orange-500 transition-colors">Vincular a um Lead (CRM)</label>
                <div className="relative">
                  <Users className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-orange-500 transition-colors" />
                  <select
                    value={form.client}
                    onChange={e => setForm({ ...form, client: e.target.value })}
                    className="w-full bg-[#1e1e1e] border border-[#333] rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors appearance-none"
                  >
                    <option value="">Sem vínculo (Reunião Interna)</option>
                    {leads.map(lead => (
                      <option key={lead.id} value={lead.title}>{lead.title}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="group">
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider group-focus-within:text-orange-500 transition-colors">Local / Plataforma</label>
                <div className="relative">
                  <Video className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-orange-500 transition-colors" />
                  <input
                    type="text"
                    value={form.platform}
                    onChange={e => setForm({ ...form, platform: e.target.value })}
                    className="w-full bg-[#1e1e1e] border border-[#333] rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors placeholder-gray-600"
                    placeholder="Google Meet, Zoom ou Endereço"
                  />
                </div>
              </div>
            </div>

            {/* Integração GCal */}
            <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 flex items-center justify-between mt-4">
               <div>
                 <h4 className="text-sm font-semibold text-blue-400 flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" /> Google Calendar
                 </h4>
                 <p className="text-xs text-gray-400 mt-1">Sincronizar e enviar convites para os participantes.</p>
               </div>
               <button
                 type="button"
                 onClick={() => setSyncGcal(!syncGcal)}
                 className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${syncGcal ? 'bg-blue-500' : 'bg-[#333]'}`}
               >
                 <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${syncGcal ? 'translate-x-6' : 'translate-x-1'}`} />
               </button>
            </div>
          </div>
        </form>

        <div className="p-6 border-t border-[#2b2b2b] bg-[#141414] flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 py-3 text-sm font-bold text-gray-400 hover:text-white bg-[#1e1e1e] border border-[#333] hover:bg-[#2b2b2b] rounded-xl transition-all">
            Cancelar
          </button>
          <button type="submit" onClick={handleSubmit} className="flex-[2] py-3 text-sm font-bold text-white bg-orange-600 hover:bg-orange-500 shadow-lg shadow-orange-500/20 rounded-xl transition-all flex justify-center items-center gap-2">
            Confirmar Agendamento
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
