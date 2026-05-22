import React, { useState, useCallback, useEffect } from 'react';
import { Play, Image as ImageIcon, FileText, CheckCircle2, MessageSquare, Calendar, X, Plus, Upload, Trash2, MessageCircle, Music, Download, Link as LinkIcon, Copy, MoreVertical, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../context/AppContext';
import useEscapeKey from '../hooks/useEscapeKey';
import { useToast } from './Toast';
import { ContentType, ContentStatus, ContentItem } from '../types';
import { Modal } from './ui/Modal';
import { ContentDetailModal } from './ContentDetailModal';
import DNAClientes from './DNAClientes';
import { ClientDetailModal } from './ClientDetailModal';
import { ContentCalendarView } from './ContentCalendarView';
import { supabase } from '../lib/supabase';

// ─── Helpers de Data ──────────────────────────────────────────────────────────
const toDisplayDate = (iso: string) => {
  if (!iso) return '';
  if (iso.includes('/')) return iso;
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

// MediaLightbox replaced by ContentDetailModal


// ─── Feedback Modal ───────────────────────────────────────────────────────────
interface FeedbackModalProps {
  onConfirm: (text: string) => void;
  onClose: () => void;
  existing?: string | null;
}

const FeedbackModal = ({ onConfirm, onClose, existing }: FeedbackModalProps) => {
  const [text, setText] = useState(existing ?? '');
  useEscapeKey(onClose);

  return (
    <Modal isOpen={true} onClose={onClose} title="Solicitar Alteração" maxWidth="max-w-md">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">Descreva as alterações necessárias:</label>
          <textarea
            autoFocus
            value={text}
            onChange={e => setText(e.target.value)}
            rows={4}
            className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 transition-all resize-none placeholder-gray-600 custom-scrollbar"
            placeholder="Ex: Aumentar o logo, trocar a cor do fundo..."
          />
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-gray-400 hover:text-white transition-colors">
            Cancelar
          </button>
          <button
            onClick={() => { if (text.trim()) { onConfirm(text.trim()); } }}
            disabled={!text.trim()}
            className="bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 disabled:opacity-40 disabled:from-yellow-800 disabled:to-yellow-800 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-[0_0_15px_rgba(234,179,8,0.2)]"
          >
            Enviar Feedback
          </button>
        </div>
      </div>
    </Modal>
  );
};

// ─── WhatsApp Notification Modal ──────────────────────────────────────────────
const WhatsAppModal = ({ contentTitle, clientEmail, onConfirm, onClose, selectedCount }: { contentTitle: string; clientEmail?: string; onConfirm: () => void; onClose: () => void; selectedCount?: number }) => {
  useEscapeKey(onClose);
  const [fromNumber, setFromNumber] = useState(
    localStorage.getItem('line_os_wa_from') || ''
  );
  const [toNumber, setToNumber] = useState('');
  
  const siteUrl = window.location.origin;
  const linkUrl = clientEmail ? `${siteUrl}/login?email=${encodeURIComponent(clientEmail)}` : siteUrl;
  
  const messagePreview = selectedCount && selectedCount > 1
    ? `Olá! Separamos ${selectedCount} materiais que estão prontos para sua revisão. Acesse o portal para aprovar ou solicitar alterações: ${linkUrl}`
    : `Olá! O material "${contentTitle}" está pronto para sua revisão. Acesse o portal para aprovar ou solicitar alterações: ${linkUrl}`;

  const handleSend = () => {
    if (fromNumber.trim()) localStorage.setItem('line_os_wa_from', fromNumber.trim());
    
    const cleanNumber = toNumber.replace(/\D/g, '');
    if (cleanNumber) {
      const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(messagePreview)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
    
    onConfirm();
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Disparo de WhatsApp" maxWidth="max-w-md">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Número de Origem</label>
            <input
              type="tel"
              value={fromNumber}
              onChange={e => setFromNumber(e.target.value)}
              placeholder="+55 11 99999-9999"
              className="w-full bg-[#111] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-all placeholder-gray-600"
            />
            <p className="text-[10px] text-gray-600 mt-1">Número da sua conta WhatsApp</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Número do Cliente</label>
            <input
              type="tel"
              value={toNumber}
              onChange={e => setToNumber(e.target.value)}
              placeholder="+55 11 98888-8888"
              className="w-full bg-[#111] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-all placeholder-gray-600"
            />
            {clientEmail && <p className="text-[10px] text-gray-600 mt-1">{clientEmail}</p>}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">Prévia da Mensagem</label>
          <div className="w-full bg-[#111] border border-emerald-500/20 rounded-xl p-4 text-sm text-gray-300 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
            <p className="italic leading-relaxed">"{messagePreview}"</p>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-4 border-t border-white/5 mt-4">
          <button onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-gray-400 hover:text-white transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSend}
            disabled={!toNumber.trim()}
            className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center gap-2"
          >
            <MessageCircle className="w-4 h-4 fill-white" /> Enviar Mensagem
          </button>
        </div>
      </div>
    </Modal>
  );
};

// ─── ContentFormModal (Novo e Edição) ──────────────────────────────────────────
const colorMap: Record<ContentType, { color: string; textColor: string; thumbnail: string }> = {
  video: { color: 'from-red-900/80 to-black', textColor: 'text-red-500', thumbnail: 'N' },
  image: { color: 'from-pink-600/80 to-orange-500/80', textColor: 'text-white', thumbnail: 'img' },
  pdf: { color: 'bg-gradient-to-br from-gray-300 to-gray-500', textColor: 'text-gray-900', thumbnail: 'pdf' },
  audio: { color: 'from-primary/80 to-blue-900/80', textColor: 'text-primary', thumbnail: 'audio' },
};

const NovoConteudoModal = ({ 
  onAdd, onEdit, initialData, onClose 
}: { 
  onAdd?: (item: Omit<ContentItem, 'id'>) => void; 
  onEdit?: (id: number, item: Partial<ContentItem>) => void;
  initialData?: ContentItem;
  onClose: () => void; 
}) => {
  const { clients } = useAppContext();
  const isEditing = !!initialData;
  const [form, setForm] = useState({
    title: initialData?.title || '',
    date: initialData?.date || new Date().toISOString().split('T')[0],
    postTime: initialData?.postTime || '',
    postChannels: initialData?.postChannels || [] as string[],
    postFormat: initialData?.postFormat || '',
    caption: initialData?.caption || '',
    clientEmail: initialData?.clientEmail || '',
    customChannel: '',
  });
  const [outrosChecked, setOutrosChecked] = useState(
    initialData?.postChannels?.some(c => c.startsWith('Outros:')) || false
  );
  useEffect(() => {
    if (initialData && outrosChecked) {
      const custom = initialData.postChannels?.find(c => c.startsWith('Outros:'));
      if (custom) setForm(f => ({ ...f, customChannel: custom.replace('Outros: ', '') }));
    }
  }, [initialData]);

  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { showToast } = useToast();
  useEscapeKey(onClose);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.date) return;
    if (!isEditing && !file) return;

    setIsUploading(true);
    let finalUrl = initialData?.fileUrl || '';
    let determinedType: ContentType = initialData?.type || 'video';

    if (file) {
      finalUrl = URL.createObjectURL(file);
      if (file.type.startsWith('audio/')) determinedType = 'audio';
      else if (file.type.startsWith('image/')) determinedType = 'image';
      else if (file.type.startsWith('video/')) determinedType = 'video';
      else if (file.type.includes('pdf')) determinedType = 'pdf';

      try {
        if (supabase) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          const { error: uploadError } = await supabase.storage.from('conteudos').upload(fileName, file);

          if (!uploadError) {
            const { data } = supabase.storage.from('conteudos').getPublicUrl(fileName);
            finalUrl = data.publicUrl;
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    
    setIsUploading(false);
    const meta = colorMap[determinedType];

    if (isEditing && onEdit && initialData) {
      onEdit(initialData.id, {
        title: form.title || initialData.title,
        date: form.date,
        postDate: form.date,
        postTime: form.postTime,
        postChannels: form.postChannels,
        postFormat: form.postFormat,
        caption: form.caption,
        clientEmail: form.clientEmail,
        fileUrl: finalUrl,
        type: determinedType,
        color: meta.color,
        textColor: meta.textColor,
        thumbnail: meta.thumbnail
      });
    } else if (onAdd && file) {
      onAdd({
        title: form.title || file.name,
        type: determinedType,
        status: 'PENDENTE',
        date: form.date, 
        postDate: form.date,
        postTime: form.postTime,
        postChannels: form.postChannels,
        postFormat: form.postFormat,
        caption: form.caption,
        clientEmail: form.clientEmail,
        feedback: null,
        fileUrl: finalUrl,
        ...meta,
      });
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={isEditing ? "Editar Mídia" : "Adicionar Mídia (Upload)"} maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">
            Cliente Vinculado *
          </label>
          <select
            required
            value={form.clientEmail}
            onChange={e => setForm({ ...form, clientEmail: e.target.value })}
            className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
          >
            <option value="">Selecione um cliente...</option>
            {clients.map(c => (
              <option key={c.id} value={c.name.toLowerCase().replace(/\s/g, '') + '@email.com'}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">
            {isEditing ? 'Substituir Arquivo (Opcional)' : 'Selecione o Arquivo'}
          </label>
          <input
            type="file"
            required={!isEditing}
            onChange={handleFileChange}
            accept="audio/mpeg,video/mp4,image/png,image/jpeg,application/pdf"
            className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-500/20 file:text-blue-400 hover:file:bg-blue-500/30 transition-all custom-scrollbar outline-none focus:ring-1 focus:ring-blue-500/50"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Título (Opcional)</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Data de Postagem</label>
            <input
              type="date"
              required
              value={form.date}
              onChange={e => setForm({ ...form, date: e.target.value })}
              className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all [color-scheme:dark]"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Canais</label>
          <div className="flex flex-wrap gap-2">
            {['Instagram', 'TikTok', 'YouTube', 'Kwai', 'LinkedIn', 'Facebook'].map(ch => (
              <label key={ch} className="flex items-center gap-2 bg-[#111] border border-white/10 px-3 py-1.5 rounded-lg text-sm text-gray-300 cursor-pointer hover:border-white/30 transition-all">
                <input
                  type="checkbox"
                  checked={form.postChannels.includes(ch)}
                  onChange={(e) => {
                    if (e.target.checked) setForm({ ...form, postChannels: [...form.postChannels, ch] });
                    else setForm({ ...form, postChannels: form.postChannels.filter(c => c !== ch) });
                  }}
                  className="accent-blue-500"
                />
                {ch}
              </label>
            ))}
            <label className="flex items-center gap-2 bg-[#111] border border-white/10 px-3 py-1.5 rounded-lg text-sm text-gray-300 cursor-pointer hover:border-white/30 transition-all">
              <input
                type="checkbox"
                checked={outrosChecked}
                onChange={e => {
                  setOutrosChecked(e.target.checked);
                  if (!e.target.checked) {
                    setForm(f => ({ ...f, postChannels: f.postChannels.filter(c => !c.startsWith('Outros:')), customChannel: '' }));
                  }
                }}
                className="accent-blue-500"
              />
              Outros
            </label>
          </div>
          {outrosChecked && (
            <input
              autoFocus
              type="text"
              value={form.customChannel}
              onChange={e => {
                const val = e.target.value;
                setForm(f => ({
                  ...f,
                  customChannel: val,
                  postChannels: [
                    ...f.postChannels.filter(c => !c.startsWith('Outros:')),
                    ...(val.trim() ? [`Outros: ${val.trim()}`] : [])
                  ]
                }));
              }}
              placeholder="Ex: Threads, Pinterest, Telegram..."
              className="mt-2 w-full bg-[#111] border border-blue-500/40 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/70 transition-all"
            />
          )}
        </div>
        <div className="flex justify-end gap-2 pt-4 border-t border-white/5">
          <button type="button" onClick={onClose} disabled={isUploading} className="px-4 py-2.5 text-sm font-medium text-gray-400 hover:text-white transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={isUploading} className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
            {isUploading ? 'Salvando...' : (isEditing ? 'Salvar Alterações' : 'Concluir Upload')}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const AprovacaoConteudo = () => {
  const { contentItems: contents, addContentItem, updateContentItem, updateContentStatus, deleteContentItem, clients } = useAppContext();
  const [filter, setFilter] = useState<'TODOS' | ContentStatus>('TODOS');
  const [clientFilter, setClientFilter] = useState<string>('TODOS');
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [feedbackTarget, setFeedbackTarget] = useState<number | string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingContent, setEditingContent] = useState<ContentItem | null>(null);
  const [whatsappTarget, setWhatsappTarget] = useState<number | string | 'multi' | null>(null);
  const [viewingContent, setViewingContent] = useState<ContentItem | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'calendar'>('grid');
  const { showToast, ToastContainer } = useToast();

  const toggleSelection = (id: number) => {
    const newSet = new Set(selectedItems);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedItems(newSet);
  };

  const handleSelectAll = () => {
    if (selectedItems.size === filteredContents.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredContents.map(c => c.id)));
    }
  };

  const handleApprove = (id: number | string) => {
    updateContentStatus(Number(id), 'APROVADO', null);
  };

  const handleRequestChange = (id: number | string) => {
    setFeedbackTarget(id);
  };

  const handleFeedbackConfirm = (text: string) => {
    if (feedbackTarget === null) return;
    
    const item = contents.find(c => c.id === Number(feedbackTarget));
    const currentFeedbacks = item?.feedbacks || [];
    const newFeedback = {
      id: Date.now().toString(),
      text: text,
      date: new Date().toISOString(),
      author: 'equipe' as const
    };

    updateContentItem(Number(feedbackTarget), {
      status: 'REVISÃO', // Agência envia de volta para revisão
      feedback: text,
      feedbacks: [...currentFeedbacks, newFeedback]
    });
    setFeedbackTarget(null);
  };

  const handleAddSubmit = (item: Omit<ContentItem, 'id'>) => {
    addContentItem(item);
    setShowAddModal(false);
    showToast('Mídia adicionada com sucesso!');
  };

  const handleEditSubmit = (id: number, data: Partial<ContentItem>) => {
    updateContentItem(id, data);
    setEditingContent(null);
    showToast('Mídia atualizada com sucesso!');
  };

  const handleNotifyConfirm = () => {
    if (whatsappTarget === null) return;
    showToast("Mensagem enviada com sucesso via WhatsApp!");
    setWhatsappTarget(null);
  };

  const handleDelete = useCallback((id: number | string) => {
    deleteContentItem(Number(id));
    showToast(`Mídia removida com sucesso.`);
  }, [deleteContentItem, showToast]);


  const filteredContents = contents.filter(c => {
    const passStatus = filter === 'TODOS' || c.status === filter;
    const passClient = clientFilter === 'TODOS' || (c.clientEmail && c.clientEmail.toLowerCase() === clientFilter.toLowerCase());
    return passStatus && passClient;
  });

  const counts = {
    TODOS: contents.filter(c => clientFilter === 'TODOS' || (c.clientEmail && c.clientEmail.toLowerCase() === clientFilter.toLowerCase())).length,
    PENDENTE: contents.filter(c => c.status === 'PENDENTE' && (clientFilter === 'TODOS' || (c.clientEmail && c.clientEmail.toLowerCase() === clientFilter.toLowerCase()))).length,
    'REVISÃO': contents.filter(c => c.status === 'REVISÃO' && (clientFilter === 'TODOS' || (c.clientEmail && c.clientEmail.toLowerCase() === clientFilter.toLowerCase()))).length,
    APROVADO: contents.filter(c => c.status === 'APROVADO' && (clientFilter === 'TODOS' || (c.clientEmail && c.clientEmail.toLowerCase() === clientFilter.toLowerCase()))).length,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 sm:p-6 lg:p-8 h-full overflow-auto text-white custom-scrollbar"
      style={{ background: 'var(--surface-0)' }}
    >
      <div className="w-full max-w-[1400px] mx-auto flex flex-col min-h-full">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-1 tracking-tight">Aprovação de Conteúdo</h1>
            <p className="text-zinc-500 text-[13px]">Revise e aprove as mídias produzidas pela equipe.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-[#141414] p-1 rounded-xl border border-white/5 shadow-inner">
              {(['TODOS', 'PENDENTE', 'REVISÃO', 'APROVADO'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${filter === f ? 'bg-[#2a2a2a] shadow-md text-white border border-white/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                  {f} <span className="ml-1 text-[10px] font-mono opacity-60">({counts[f]})</span>
                </button>
              ))}
            </div>
            
            {/* Filtro de Clientes */}
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="bg-[#141414] border border-white/5 text-gray-300 text-sm rounded-xl px-4 py-2 outline-none focus:border-yellow-500/50 transition-colors"
            >
              <option value="TODOS">Todos os Clientes</option>
              {clients.map(c => (
                <option key={c.id} value={c.name.toLowerCase().replace(/\s/g, '') + '@email.com' /* mockup based on how email might be generated */}>{c.name}</option>
              ))}
            </select>

            <button
              onClick={() => {
                if (selectedItems.size > 0) {
                  setWhatsappTarget('multi');
                } else {
                  showToast('Selecione pelo menos um conteúdo para gerar o link.', () => {});
                }
              }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-[13px] font-medium flex items-center gap-2 transition-all border border-emerald-500 shadow-lg shadow-emerald-500/20"
            >
              <LinkIcon className="w-4 h-4" /> Link Builder {selectedItems.size > 0 && `(${selectedItems.size})`}
            </button>
            
            <div className="flex bg-[#141414] p-1 rounded-xl border border-white/5 mx-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${viewMode === 'grid' ? 'bg-[#2a2a2a] text-white shadow-md border border-white/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
              >
                Grade
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all flex items-center gap-1.5 ${viewMode === 'calendar' ? 'bg-[#2a2a2a] text-white shadow-md border border-white/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
              >
                <Calendar className="w-3.5 h-3.5" /> 360º
              </button>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-[13px] font-medium flex items-center gap-2 transition-all shadow-lg shadow-red-500/20"
            >
              <Upload className="w-4 h-4" /> Adicionar Mídia
            </button>
          </div>
        </div>

        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
            <AnimatePresence mode='popLayout'>
              {filteredContents.map((content) => (
                <motion.div
                  key={content.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="bg-[#141414] border border-[#222] rounded-2xl overflow-hidden flex flex-col group hover:border-[#444] transition-all hover:shadow-2xl hover:shadow-black/50 relative"
                >
                  <div className={`relative aspect-video sm:h-auto sm:aspect-video ${content.color} flex items-center justify-center overflow-hidden border-b border-[#222]`}>
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/40 transition-colors z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 backdrop-blur-[2px]">
                      <button
                        onClick={() => setViewingContent(content)}
                        className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors border border-white/20 shadow-xl"
                      >
                        <Play className="w-5 h-5 fill-white" /> Detalhes do Arquivo
                      </button>
                    </div>

                    {/* Seleção */}
                    <div 
                      className="absolute top-3 left-3 z-30 cursor-pointer"
                      onClick={(e) => { e.stopPropagation(); toggleSelection(content.id); }}
                    >
                      <div className={`w-5 h-5 rounded border ${selectedItems.has(content.id) ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-black/50 border-white/20 hover:border-white/50'} flex items-center justify-center backdrop-blur-sm transition-colors`}>
                        {selectedItems.has(content.id) && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                    </div>

                    {/* Top badges */}
                    <div className="absolute top-3 left-10 flex gap-2 z-20">
                      <div className="bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5 text-white border border-white/10">
                        {content.type === 'video' && <Play className="w-3 h-3" />}
                        {content.type === 'image' && <ImageIcon className="w-3 h-3" />}
                        {content.type === 'pdf' && <FileText className="w-3 h-3" />}
                        {content.type}
                      </div>
                    </div>

                    <div className="absolute top-3 right-3 flex gap-2 z-20">
                      <div className={`px-2.5 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 border ${content.status === 'PENDENTE' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                          content.status === 'REVISÃO' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                            'bg-green-500/20 text-green-400 border-green-500/30'
                        }`}>
                        {content.status}
                      </div>
                    </div>

                    {/* Thumbnail Previews */}
                    {content.fileUrl ? (
                      content.type === 'image' ? (
                        <img src={content.fileUrl} className="w-full h-full object-cover opacity-80 mix-blend-screen" />
                      ) : content.type === 'video' ? (
                        <video src={content.fileUrl} className="w-full h-full object-cover opacity-80 mix-blend-screen" autoPlay muted loop />
                      ) : content.type === 'audio' ? (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-black/60 backdrop-blur-md relative z-10">
                          <Music className={`w-8 h-8 ${content.textColor} mb-3`} />
                          <audio src={content.fileUrl} controls className="w-[85%] max-w-[200px] h-8 opacity-90 transition-opacity z-20 outline-none" />
                        </div>
                      ) : (
                        <div className="w-24 h-32 bg-white/90 shadow-2xl rounded-md flex flex-col p-3 border border-gray-300 transform -rotate-2 relative z-10">
                          <div className="w-1/2 h-2.5 bg-red-500 rounded-sm mb-4"></div>
                          <div className="space-y-2">
                            <div className="w-full h-1.5 bg-gray-300 rounded"></div>
                            <div className="w-full h-1.5 bg-gray-300 rounded"></div>
                            <div className="w-3/4 h-1.5 bg-gray-300 rounded"></div>
                          </div>
                        </div>
                      )
                    ) : (
                      <>
                        {content.thumbnail === 'N' && <span className={`text-7xl font-bold ${content.textColor} drop-shadow-2xl`}>N</span>}
                        {content.thumbnail === 'audio' && <Music className={`w-16 h-16 ${content.textColor} drop-shadow-lg opacity-80`} />}
                        {content.thumbnail === 'img' && (
                          <div className={`w-20 h-20 border-[6px] border-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm ${content.textColor}`}>
                            <ImageIcon className="w-8 h-8 opacity-80" />
                          </div>
                        )}
                        {content.thumbnail === 'pdf' && (
                          <div className="w-24 h-32 bg-white/90 shadow-2xl rounded-md flex flex-col p-3 border border-gray-300 transform -rotate-2">
                            <div className="w-1/2 h-2.5 bg-red-500 rounded-sm mb-4"></div>
                            <div className="space-y-2">
                              <div className="w-full h-1.5 bg-gray-300 rounded"></div>
                              <div className="w-full h-1.5 bg-gray-300 rounded"></div>
                              <div className="w-3/4 h-1.5 bg-gray-300 rounded"></div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <div className="p-5 flex-1 flex flex-col relative bg-gradient-to-b from-[#141414] to-[#0a0a0a]">
                    <h3 className="font-semibold text-[15px] mb-2 text-white pr-6 leading-snug">{content.title}</h3>
                    
                    <div className="flex items-center gap-3 mb-5">
                      <button onClick={() => setViewMode('calendar')} className="text-xs text-gray-400 hover:text-emerald-400 flex items-center gap-1.5 font-medium transition-colors bg-[#222] hover:bg-[#333] px-2 py-1 rounded">
                        <Calendar className="w-3.5 h-3.5" /> Post: {toDisplayDate(content.postDate)}
                      </button>
                      {content.postChannels && content.postChannels.length > 0 && (
                        <div className="flex gap-1">
                          {content.postChannels.slice(0, 2).map(ch => (
                            <span key={ch} className="text-[10px] bg-white/10 text-gray-300 px-1.5 py-0.5 rounded font-bold uppercase">{ch}</span>
                          ))}
                          {content.postChannels.length > 2 && <span className="text-[10px] bg-white/10 text-gray-300 px-1.5 py-0.5 rounded font-bold">+{content.postChannels.length - 2}</span>}
                        </div>
                      )}
                    </div>

                    <div className="mt-auto pt-4 flex flex-col gap-3">
                      {content.status === 'APROVADO' ? (
                        <div className="flex flex-col gap-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm('Tem certeza que deseja retirar a aprovação deste conteúdo?')) {
                                updateContentStatus(content.id, 'PENDENTE', null);
                                showToast('Aprovação retirada com sucesso.');
                              }
                            }}
                            className="w-full py-2.5 rounded-xl text-sm font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                            title="Toque para retirar aprovação"
                          >
                            <CheckCircle2 className="w-4 h-4" /> Aprovado (Desfazer)
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleDelete(content.id)}
                            className="p-3 rounded-xl bg-[#222] hover:bg-red-500/20 text-gray-400 hover:text-red-400 border border-[#333] hover:border-red-500/30 transition-all"
                            title="Excluir Mídia"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingContent(content)}
                            className="p-3 rounded-xl bg-[#222] hover:bg-blue-500/20 text-gray-400 hover:text-blue-400 border border-[#333] hover:border-blue-500/30 transition-all"
                            title="Editar Mídia"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setWhatsappTarget(content.id)}
                            className="p-3 flex-1 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-medium flex items-center justify-center gap-2 border border-emerald-500/20 shadow-lg shadow-emerald-500/10 transition-all"
                          >
                            <MessageSquare className="w-4 h-4" /> Notificar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <ContentCalendarView onContentClick={(c) => setViewingContent(c)} />
        )}
      </div>

      <AnimatePresence>
        {whatsappTarget !== null && (
          <WhatsAppModal
            contentTitle={whatsappTarget === 'multi' ? 'Múltiplos Materiais' : (contents.find(c => c.id === whatsappTarget)?.title || '')}
            clientEmail={whatsappTarget === 'multi' ? (contents.find(c => selectedItems.has(c.id))?.clientEmail) : (contents.find(c => c.id === whatsappTarget)?.clientEmail)}
            selectedCount={whatsappTarget === 'multi' ? selectedItems.size : undefined}
            onConfirm={handleNotifyConfirm}
            onClose={() => setWhatsappTarget(null)}
          />
        )}
        {feedbackTarget !== null && (
          <FeedbackModal
            onConfirm={handleFeedbackConfirm}
            onClose={() => setFeedbackTarget(null)}
            existing={contents.find(c => c.id === feedbackTarget)?.feedback}
          />
        )}
        {showAddModal && <NovoConteudoModal onAdd={handleAddSubmit} onClose={() => setShowAddModal(false)} />}
        {editingContent && <NovoConteudoModal initialData={editingContent} onEdit={handleEditSubmit} onClose={() => setEditingContent(null)} />}
        {viewingContent !== null && (
          <ContentDetailModal
            content={viewingContent}
            onClose={() => setViewingContent(null)}
            onApprove={handleApprove}
            onRequestChange={handleRequestChange}
            onRevokeApproval={(id) => {
              updateContentStatus(Number(id), 'PENDENTE', null);
              setViewingContent(null);
              showToast('Aprovação retirada com sucesso.');
            }}
          />
        )}
      </AnimatePresence>
      <ToastContainer />
    </motion.div>
  );
};

export default AprovacaoConteudo;
