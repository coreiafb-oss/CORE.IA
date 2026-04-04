import React, { useState, useCallback, useMemo } from 'react';
import { Calendar as CalendarIcon, Clock, Users, Video, Plus, X, ChevronLeft, ChevronRight, Trash2, MapPin, ArrowRight, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../context/AppContext';
import useEscapeKey from '../hooks/useEscapeKey';
import { useToast } from './Toast';
import { Meeting } from '../types';

// ─── Utils ─────────────────────────────────────────────────────────────────
const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();
const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const formatDate = (date: Date) => date.toISOString().split('T')[0];

const toDisplayDate = (iso: string) => {
  if (!iso) return '';
  if (iso.includes('/')) return iso;
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

// Determina cores das labels pelas plataformas (para TimeLine e Grid)
const getPlatformColor = (platform: string) => {
  const p = platform.toLowerCase();
  if (p.includes('meet')) return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400' };
  if (p.includes('zoom')) return { bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-400' };
  if (p.includes('teams')) return { bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-400' };
  if (p.includes('presencial')) return { bg: 'bg-orange-500/10', text: 'text-orange-400', dot: 'bg-orange-400' };
  return { bg: 'bg-gray-500/10', text: 'text-gray-400', dot: 'bg-gray-400' };
};

// ─── Drawer: Nova Reunião ────────────────────────────────────────────────────
interface NovaReuniaoDrawerProps {
  onAdd: (meeting: Omit<Meeting, 'id'>) => void;
  onClose: () => void;
  initialDate?: string;
}

const NovaReuniaoDrawer = ({ onAdd, onClose, initialDate }: NovaReuniaoDrawerProps) => {
  const [form, setForm] = useState({
    title: '',
    date: initialDate || formatDate(new Date()),
    time: '14:00',
    duration: '60',
    client: '',
    platform: 'Google Meet'
  });

  useEscapeKey(onClose);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.date || !form.time) return;

    const [hours, mins] = form.time.split(':').map(Number);
    const end = new Date(0, 0, 0, hours, mins + parseInt(form.duration));
    const timeStr = `${form.time} - ${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`;
    const isToday = form.date === formatDate(new Date());

    onAdd({
      title: form.title,
      date: form.date,
      time: timeStr,
      client: form.client || 'Interno',
      platform: form.platform,
      isToday
    });
  };

  return (
    <AnimatePresence>
      <motion.div 
        key="backdrop"
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          key="drawer"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }}
          className="w-full max-w-[480px] h-full bg-[#0a0a0a]/95 border-l border-white/5 shadow-2xl flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Header Drawer */}
          <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-br from-white/[0.02] to-transparent">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Novo Agendamento</h2>
              <p className="text-sm text-gray-400 mt-1">Preencha os detalhes do seu compromisso.</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-6">
            <div className="space-y-4">
              {/* Título */}
              <div className="group">
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider group-focus-within:text-orange-500 transition-colors">Assunto / Título</label>
                <input
                  type="text" required autoFocus
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500 focus:bg-orange-500/5 transition-all shadow-inner"
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
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500 focus:bg-orange-500/5 transition-all [color-scheme:dark] shadow-inner"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="group">
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider group-focus-within:text-orange-500 transition-colors">Hora</label>
                    <input
                      type="time" required
                      value={form.time}
                      onChange={e => setForm({ ...form, time: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-orange-500 focus:bg-orange-500/5 transition-all [color-scheme:dark] shadow-inner"
                    />
                  </div>
                  <div className="group">
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider group-focus-within:text-orange-500 transition-colors">Duração</label>
                    <select
                      value={form.duration}
                      onChange={e => setForm({ ...form, duration: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-2 py-3 text-sm text-white focus:outline-none focus:border-orange-500 focus:bg-orange-500/5 transition-all appearance-none cursor-pointer shadow-inner"
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

              {/* Cliente e Plataforma */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-white-[0.02] to-[#111] border border-white/5 space-y-4 shadow-sm">
                <div className="group">
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider group-focus-within:text-orange-500 transition-colors">Cliente / Contato</label>
                  <div className="relative">
                    <Users className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-orange-500 transition-colors" />
                    <input
                      type="text"
                      value={form.client}
                      onChange={e => setForm({ ...form, client: e.target.value })}
                      className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500 focus:bg-orange-500/5 transition-all placeholder-gray-600"
                      placeholder="Nome do cliente ou empresa"
                    />
                  </div>
                </div>
                <div className="group">
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider group-focus-within:text-orange-500 transition-colors">Local / Link</label>
                  <div className="relative">
                    <Video className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-orange-500 transition-colors" />
                    <input
                      type="text"
                      value={form.platform}
                      onChange={e => setForm({ ...form, platform: e.target.value })}
                      className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500 focus:bg-orange-500/5 transition-all placeholder-gray-600"
                      placeholder="Google Meet, Zoom ou Endereço"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Form */}
            <div className="mt-auto pt-6 flex gap-3">
              <button type="button" onClick={onClose} className="flex-1 py-3 text-sm font-semibold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all">
                Cancelar
              </button>
              <button type="submit" className="flex-[2] py-3 text-sm font-bold text-white bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.3)] rounded-xl transition-all flex justify-center items-center gap-2">
                Agendar Compromisso
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
const Agendamento = () => {
  const { meetings, setMeetings, addMeeting } = useAppContext();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(formatDate(new Date()));
  const { showToast, ToastContainer } = useToast();

  const handleAddMeeting = (meeting: Omit<Meeting, 'id'>) => {
    addMeeting(meeting);
    setIsDrawerOpen(false);
  };

  const handleDelete = useCallback((id: number | string) => {
    const deleted = meetings.find((m) => m.id === id);
    if (!deleted) return;
    setMeetings((prev) => prev.filter((m) => m.id !== id));
    showToast(`"${deleted.title}" cancelada.`, () => {
      setMeetings((prev) => {
        const exists = prev.find((m) => m.id === id);
        if (exists) return prev;
        return [deleted, ...prev].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      });
    });
  }, [meetings, setMeetings, showToast]);

  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const goToday = () => {
    const d = new Date();
    setCurrentDate(d);
    setSelectedDateStr(formatDate(d));
  };

  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());
  const todayStr = formatDate(new Date());

  // Mapear eventos por data (YYYY-MM-DD)
  const meetingsByDate = useMemo(() => {
    const map: Record<string, Meeting[]> = {};
    meetings.forEach(m => {
      let isoDate = m.date;
      if (isoDate.toLowerCase() === 'hoje') isoDate = todayStr;
      else if (isoDate.toLowerCase() === 'amanhã') {
        const d = new Date(); d.setDate(d.getDate() + 1);
        isoDate = formatDate(d);
      }
      if (isoDate.includes('/')) {
        const parts = isoDate.split('/');
        isoDate = parts.length === 2 ? `${currentDate.getFullYear()}-${parts[1]}-${parts[0]}` : `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
      if (!map[isoDate]) map[isoDate] = [];
      map[isoDate].push(m);
    });
    // Sort items em cada dia pelo tempo de inicio
    Object.keys(map).forEach(date => {
      map[date].sort((a,b) => a.time.localeCompare(b.time));
    });
    return map;
  }, [meetings, currentDate, todayStr]);

  // Lista selecionada (Timeline)
  const timelineMeetings = useMemo(() => {
    let list = [];
    if (selectedDateStr && meetingsByDate[selectedDateStr]) {
      list = [...meetingsByDate[selectedDateStr]];
    } else {
      // Fallback: eventos dos próximos 7 dias
      list = [...meetings]
        .filter(m => {
           let iso = m.date;
           if (iso.toLowerCase() === 'hoje') iso = todayStr;
           if (iso.includes('/')) {
              const p = iso.split('/');
              iso = p.length === 2 ? `${currentDate.getFullYear()}-${p[1]}-${p[0]}` : `${p[2]}-${p[1]}-${p[0]}`;
           }
           return iso >= todayStr;
        })
        .sort((a, b) => {
           let isoA = a.date.includes('/') ? `${a.date.split('/')[2] || currentDate.getFullYear()}-${a.date.split('/')[1]}-${a.date.split('/')[0]}` : a.date;
           let isoB = b.date.includes('/') ? `${b.date.split('/')[2] || currentDate.getFullYear()}-${b.date.split('/')[1]}-${b.date.split('/')[0]}` : b.date;
           if (isoA === 'hoje') isoA = todayStr; if (isoB === 'hoje') isoB = todayStr;
           if (isoA === isoB) return a.time.localeCompare(b.time);
           return isoA.localeCompare(isoB);
        })
        .slice(0, 8);
    }
    
    if (searchQuery.trim()) {
       const q = searchQuery.toLowerCase();
       return list.filter(m => m.title.toLowerCase().includes(q) || (m.client && m.client.toLowerCase().includes(q)));
    }
    return list;
  }, [meetings, selectedDateStr, meetingsByDate, todayStr, currentDate, searchQuery]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
      className="p-6 lg:p-8 h-full flex flex-col text-white overflow-hidden"
      style={{ background: 'var(--surface-0)' }}
    >
      <div className="max-w-[1400px] mx-auto w-full h-full flex flex-col">
        {/* Superior Actions & Status */}
        <div className="flex items-center justify-between mb-6 flex-shrink-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight mb-1">
              Agendamentos
            </h1>
            <p className="text-zinc-500 text-[13px]">Visualize e coordene as próximas calls e reuniões estratégicas.</p>
          </div>
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-[13px] font-medium text-white bg-red-600 hover:bg-red-500 rounded-lg shadow-lg shadow-red-500/20 transition-all"
          >
            <CalendarIcon className="w-4 h-4" /> 
            <span>Agendar Call</span>
          </button>
        </div>

        {/* Dashboard Cards (KPIs) */}
        <div className="flex gap-4 mb-8 flex-shrink-0 h-[100px]">
           <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center p-5 relative overflow-hidden group hover:border-white/10 transition-colors">
              <div className="absolute right-0 top-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
              <div>
                 <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5 group-hover:text-orange-400 transition-colors">Total este mês</p>
                 <div className="text-3xl font-bold">{Object.values(meetingsByDate).flat().length}</div>
              </div>
           </div>
           <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center p-5 relative overflow-hidden group hover:border-white/10 transition-colors">
              <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
              <div>
                 <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5 group-hover:text-emerald-400 transition-colors">Próximos 7 dias</p>
                 <div className="text-3xl font-bold">{timelineMeetings.length}</div>
              </div>
           </div>
           <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center p-5 relative overflow-hidden group hover:border-white/10 transition-colors">
              <div className="absolute right-0 top-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
              <div>
                 <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5 group-hover:text-blue-400 transition-colors">Status Hoje</p>
                 <div className="text-xl font-medium text-gray-300">
                    {meetingsByDate[todayStr]?.length ? <span className="text-white">{meetingsByDate[todayStr].length} eventos hoje</span> : 'Dia limpo, sem reuniões'}
                 </div>
              </div>
           </div>
        </div>

        {/* Content Area flex */}
        <div className="flex gap-6 flex-1 overflow-hidden min-h-0 relative">
          
          {/* Main Calendar View (Glassmorphic Window) */}
          <div className="flex-1 rounded-3xl bg-[#111]/70 backdrop-blur-xl border border-white/10 flex flex-col overflow-hidden shadow-2xl relative z-10">
            {/* Header Calendário */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center justify-center shadow-inner">
                   <div className="text-[9px] font-bold text-orange-500 uppercase tracking-widest">{monthNames[currentDate.getMonth()].substring(0,3)}</div>
                   <div className="text-sm font-bold text-gray-200">{currentDate.getFullYear()}</div>
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-white/90">
                  {monthNames[currentDate.getMonth()]}
                </h2>
              </div>
              <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md p-1.5 rounded-xl border border-white/5">
                <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
                   <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={goToday} className="px-4 h-8 text-[11px] font-bold uppercase tracking-wider hover:bg-white/10 rounded-lg text-white transition-colors">Hoje</button>
                <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
                   <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Grid Days Header */}
            <div className="grid grid-cols-7 border-b border-white/5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                <div key={day} className="py-4 text-center">{day}</div>
              ))}
            </div>

            {/* Grid Body */}
            <div className="flex-1 bg-white/[0.01] grid grid-cols-7 grid-rows-5 overflow-y-auto custom-scrollbar p-1 gap-1">
               {Array.from({ length: 35 }).map((_, i) => {
                  const dayNum = i - firstDay + 1;
                  const isCurrentMonth = dayNum > 0 && dayNum <= daysInMonth;
                  const dateIso = isCurrentMonth ? `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}` : null;
                  const dayMeetings = dateIso ? meetingsByDate[dateIso] || [] : [];
                  const isTodayBox = dateIso === todayStr;
                  const isSelected = dateIso === selectedDateStr;

                  return (
                    <motion.div
                      layoutId={`day-${dateIso || i}`}
                      key={i}
                      onClick={() => {
                        if (dateIso) {
                            setSelectedDateStr(dateIso);
                        }
                      }}
                      className={`min-h-[110px] rounded-2xl p-2.5 flex flex-col transition-all cursor-pointer group relative overflow-hidden ${
                        !isCurrentMonth ? 'opacity-30 pointer-events-none' :
                        isSelected ? 'bg-orange-500/10 ring-1 ring-inset ring-orange-500/50 shadow-[inset_0_0_20px_rgba(249,115,22,0.1)]' :
                        'bg-white/[0.02] hover:bg-white/[0.05] border border-transparent hover:border-white/5'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2 relative z-10">
                        <span className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                           isTodayBox ? 'bg-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.5)]' :
                           isSelected ? 'text-orange-400' : 'text-gray-400 group-hover:text-white'
                        }`}>
                          {isCurrentMonth ? dayNum : ''}
                        </span>
                        
                        {/* Hover Action to Add Meeting */}
                        {isCurrentMonth && (
                          <button
                            onClick={(e) => { 
                               e.stopPropagation(); 
                               setSelectedDateStr(dateIso);
                               setIsDrawerOpen(true); 
                            }}
                            className="w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-white/10 text-gray-400 hover:text-orange-400 transition-all transform scale-90 group-hover:scale-100"
                            title="Agendar neste dia"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Chips das Meetings */}
                      <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto custom-scrollbar no-scrollbar relative z-10">
                         {dayMeetings.slice(0, 3).map(m => {
                            const colors = getPlatformColor(m.platform);
                            return (
                              <div key={m.id} className={`${colors.bg} ${colors.text} px-2 py-1 rounded-md flex items-center gap-1.5 font-medium text-[10px] whitespace-nowrap overflow-hidden transition-all group-hover:opacity-100 opacity-80 border border-white/5`}>
                                 <div className={`w-1 h-1 rounded-full ${colors.dot} flex-shrink-0 animate-pulse`} />
                                 <span className="truncate">{m.time.split('-')[0].trim()} - {m.title}</span>
                              </div>
                            );
                         })}
                         {dayMeetings.length > 3 && (
                            <div className="text-[10px] font-medium text-gray-500 pl-1">+ {dayMeetings.length - 3} mais</div>
                         )}
                      </div>
                    </motion.div>
                  );
               })}
            </div>
          </div>

          {/* Sidebar / Timeline View */}
          <div className="w-[420px] rounded-3xl bg-black/20 border border-white/5 flex flex-col shadow-2xl overflow-hidden flex-shrink-0 backdrop-blur-xl">
            {/* Header Timeline */}
            <div className="px-6 py-5 border-b border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent sticky top-0 z-20 backdrop-blur-md">
               <h3 className="font-extrabold text-xl text-white mb-1.5 flex items-center gap-2">
                 {selectedDateStr === todayStr && <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                 {selectedDateStr ? toDisplayDate(selectedDateStr) : 'Próximos Compromissos'}
               </h3>
               <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">
                 {timelineMeetings.length} {timelineMeetings.length === 1 ? 'reunião' : 'reuniões'} agendadas
               </p>
               <div className="relative">
                 <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                 <input
                   type="text"
                   value={searchQuery}
                   onChange={e => setSearchQuery(e.target.value)}
                   placeholder="Buscar reuniões..."
                   className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-orange-500 focus:bg-orange-500/5 transition-all placeholder-gray-600 shadow-inner"
                 />
               </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 relative">
              <AnimatePresence mode="popLayout">
                {timelineMeetings.length === 0 ? (
                   <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 flex flex-col items-center justify-center gap-4 opacity-40">
                      <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center">
                         <CalendarIcon className="w-10 h-10 text-gray-400" />
                      </div>
                      <p className="text-sm font-medium tracking-wide">Dia limpo. Aproveite!</p>
                   </motion.div>
                ) : (
                  <div className="relative border-l border-white/10 ml-[23px] pl-6 pb-4 space-y-8 mt-2">
                    {timelineMeetings.map((meeting, index) => {
                       const colors = getPlatformColor(meeting.platform);
                       return (
                        <motion.div
                          key={meeting.id}
                          layout
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ delay: index * 0.05 }}
                          className="relative group"
                        >
                          {/* Dot na linha do tempo */}
                          <div className={`absolute -left-[30px] top-1.5 w-3 h-3 rounded-full ${colors.dot} ring-4 ring-[#111] shadow-[0_0_10px_currentColor]`} style={{ color: "currentColor" }} />
                          
                          {/* Card */}
                          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 hover:bg-white/[0.05] hover:border-white/10 transition-all cursor-pointer backdrop-blur-md shadow-lg group-hover:shadow-2xl">
                            
                            <div className="flex justify-between items-start mb-4 relative z-10">
                               <div className="flex flex-col gap-1">
                                  <div className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">{meeting.time}</div>
                                  <h4 className="font-bold text-white text-base leading-tight group-hover:text-orange-400 transition-colors pr-6">{meeting.title}</h4>
                               </div>
                               <button
                                 onClick={(e) => { e.stopPropagation(); handleDelete(meeting.id); }}
                                 className="absolute top-0 right-0 p-1.5 bg-black/40 backdrop-blur-sm rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                                 title="Cancelar Reunião"
                               >
                                  <Trash2 className="w-3.5 h-3.5" />
                               </button>
                            </div>

                            <div className="flex flex-col gap-2.5 text-sm">
                              {meeting.client && (
                                <div className="flex items-center gap-3 text-gray-300">
                                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0 text-gray-400">
                                    <Users className="w-4 h-4" />
                                  </div>
                                  <span className="font-medium truncate">{meeting.client}</span>
                                </div>
                              )}
                              {meeting.platform && (
                                <div className="flex items-center gap-3 text-gray-300">
                                  <div className={`w-8 h-8 rounded-full ${colors.bg} flex items-center justify-center flex-shrink-0 ${colors.text}`}>
                                    {meeting.platform.toLowerCase().includes('presencial') ? <MapPin className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                                  </div>
                                  <span className="font-medium truncate">{meeting.platform}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                       )
                    })}
                  </div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Quick Add at Bottom of Timeline */}
            <div className="p-4 border-t border-white/5 bg-black/20 backdrop-blur-md">
               <button 
                 onClick={() => setIsDrawerOpen(true)}
                 className="w-full py-3.5 rounded-xl border border-dashed border-white/20 text-sm font-semibold text-gray-400 hover:text-white hover:border-orange-500/50 hover:bg-orange-500/10 active:scale-95 transition-all flex items-center justify-center gap-2"
               >
                  <Plus className="w-4 h-4" /> Adicionar na Timeline
               </button>
            </div>
          </div>
        </div>
      </div>

      {isDrawerOpen && <NovaReuniaoDrawer onAdd={handleAddMeeting} onClose={() => setIsDrawerOpen(false)} initialDate={selectedDateStr || undefined} />}
      <ToastContainer />
    </motion.div>
  );
};

export default Agendamento;
