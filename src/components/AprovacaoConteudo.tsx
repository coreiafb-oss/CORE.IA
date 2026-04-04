import React, { useState, useCallback } from 'react';
import { Play, Image as ImageIcon, FileText, CheckCircle2, MessageSquare, Calendar, X, Plus, Upload, Trash2, MessageCircle, Music } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../context/AppContext';
import useEscapeKey from '../hooks/useEscapeKey';
import { useToast } from './Toast';
import { ContentType, ContentStatus, ContentItem } from '../types';
import { Modal } from './ui/Modal';

// ─── Helpers de Data ──────────────────────────────────────────────────────────
const toDisplayDate = (iso: string) => {
  if (!iso) return '';
  if (iso.includes('/')) return iso;
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

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
const WhatsAppModal = ({ contentTitle, onConfirm, onClose }: { contentTitle: string; onConfirm: () => void; onClose: () => void }) => {
  useEscapeKey(onClose);
  const messagePreview = `Olá! O material "${contentTitle}" está pronto para sua revisão. Clique no link para aprovar ou solicitar alterações.`;

  return (
    <Modal isOpen={true} onClose={onClose} title="Disparo de WhatsApp" maxWidth="max-w-md">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">Prévia da Mensagem (Evolution API)</label>
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
            onClick={onConfirm}
            className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center gap-2"
          >
            <MessageCircle className="w-4 h-4 fill-white" /> Enviar Mensagem
          </button>
        </div>
      </div>
    </Modal>
  );
};

// ─── Novo Conteúdo Modal ──────────────────────────────────────────────────────
const colorMap: Record<ContentType, { color: string; textColor: string; thumbnail: string }> = {
  video: { color: 'from-red-900/80 to-black', textColor: 'text-red-500', thumbnail: 'N' },
  image: { color: 'from-pink-600/80 to-orange-500/80', textColor: 'text-white', thumbnail: 'img' },
  pdf:   { color: 'bg-gradient-to-br from-gray-300 to-gray-500', textColor: 'text-gray-900', thumbnail: 'pdf' },
  audio: { color: 'from-primary/80 to-blue-900/80', textColor: 'text-primary', thumbnail: 'audio' },
};

const NovoConteudoModal = ({ onAdd, onClose }: { onAdd: (item: Omit<ContentItem, 'id'>) => void; onClose: () => void }) => {
  const [form, setForm] = useState({ title: '', date: new Date().toISOString().split('T')[0] });
  const [file, setFile] = useState<File | null>(null);
  useEscapeKey(onClose);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !form.date) return;
    
    const fileUrl = URL.createObjectURL(file);
    let determinedType: ContentType = 'video'; 
    
    if (file.type.startsWith('audio/')) determinedType = 'audio';
    else if (file.type.startsWith('image/')) determinedType = 'image';
    else if (file.type.startsWith('video/')) determinedType = 'video';
    else if (file.type.includes('pdf')) determinedType = 'pdf';
    
    const meta = colorMap[determinedType];
    
    onAdd({
      title: form.title || file.name,
      type: determinedType,
      status: 'PENDENTE',
      date: form.date,
      feedback: null,
      fileUrl,
      ...meta,
    });
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Adicionar Mídia (Upload)" maxWidth="max-w-md">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Selecione o Arquivo</label>
            <input
              type="file"
              required
              onChange={handleFileChange}
              accept="audio/mpeg,video/mp4,image/png,image/jpeg,application/pdf"
              className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-500/20 file:text-blue-400 hover:file:bg-blue-500/30 transition-all custom-scrollbar outline-none focus:ring-1 focus:ring-blue-500/50"
            />
            <p className="text-[10px] text-gray-500 mt-2">Suportado: mp3, mp4, png, jpeg, pdf</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Título (Opcional)</label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder-gray-600"
                placeholder="Ex: Campanha Feed"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Data de Entrega</label>
              <input
                type="date"
                required
                value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
                className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all [color-scheme:dark]"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-white/5">
            <button type="button" onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-gray-400 hover:text-white transition-colors">
              Cancelar
            </button>
            <button type="submit" className="bg-gradient-to-r from-primary to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
              <Upload className="w-4 h-4" /> Enviar Arquivo
            </button>
          </div>
        </form>
    </Modal>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const AprovacaoConteudo = () => {
  const { contentItems: contents, setContentItems: setContents, addContentItem } = useAppContext();
  const [filter, setFilter] = useState<'TODOS' | ContentStatus>('TODOS');
  const [feedbackTarget, setFeedbackTarget] = useState<number | string | null>(null);
  const [showNovoModal, setShowNovoModal] = useState(false);
  const [whatsappTarget, setWhatsappTarget] = useState<number | string | null>(null);
  const { showToast, ToastContainer } = useToast();

  const handleApprove = (id: number | string) => {
    setContents(prev => prev.map(c => c.id === id ? { ...c, status: 'APROVADO' as ContentStatus, feedback: null } : c));
  };

  const handleRequestChange = (id: number | string) => {
    setFeedbackTarget(id);
  };

  const handleFeedbackConfirm = (text: string) => {
    if (feedbackTarget === null) return;
    setContents(prev => prev.map(c => c.id === feedbackTarget ? { ...c, status: 'REVISÃO' as ContentStatus, feedback: text } : c));
    setFeedbackTarget(null);
  };

  const handleNotifyConfirm = () => {
    if (whatsappTarget === null) return;
    showToast("Mensagem enviada com sucesso via WhatsApp!");
    setWhatsappTarget(null);
  };

  const handleAddContent = (item: Omit<ContentItem, 'id'>) => {
    addContentItem(item);
    setShowNovoModal(false);
  };

  const handleDelete = useCallback((id: number | string) => {
    const deleted = contents.find((c) => c.id === id);
    if (!deleted) return;
    setContents((prev) => prev.filter((c) => c.id !== id));
    showToast(`"${deleted.title}" removido.`, () => {
      setContents((prev) => {
        const exists = prev.find((c) => c.id === id);
        if (exists) return prev;
        return [deleted, ...prev];
      });
    });
  }, [contents, setContents, showToast]);


  const filteredContents = contents.filter(c => filter === 'TODOS' || c.status === filter);

  const counts = {
    TODOS: contents.length,
    PENDENTE: contents.filter(c => c.status === 'PENDENTE').length,
    'REVISÃO': contents.filter(c => c.status === 'REVISÃO').length,
    APROVADO: contents.filter(c => c.status === 'APROVADO').length,
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
            <button
              onClick={() => setShowNovoModal(true)}
              className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-[13px] font-medium flex items-center gap-2 transition-all shadow-lg shadow-red-500/20"
            >
              <Upload className="w-4 h-4" /> Adicionar Mídia
            </button>
          </div>
        </div>

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
                {/* Header Thumb */}
                <div className={`relative aspect-video sm:h-auto sm:aspect-video ${content.color} flex items-center justify-center overflow-hidden border-b border-[#222]`}>
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/40 transition-colors z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 backdrop-blur-[2px]">
                    <button className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors border border-white/20 shadow-xl">
                      <Play className="w-5 h-5 fill-white" /> Visualizar Arquivo
                    </button>
                  </div>

                  {/* Top badges */}
                  <div className="absolute top-3 left-3 flex gap-2 z-20">
                    <div className="bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5 text-white border border-white/10">
                      {content.type === 'video' && <Play className="w-3 h-3" />}
                      {content.type === 'image' && <ImageIcon className="w-3 h-3" />}
                      {content.type === 'pdf' && <FileText className="w-3 h-3" />}
                      {content.type}
                    </div>
                  </div>

                  <div className="absolute top-3 right-3 flex gap-2 z-20">
                    <div className={`px-2.5 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 border ${
                      content.status === 'PENDENTE' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                      content.status === 'REVISÃO'  ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
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

                {/* Content Body */}
                <div className="p-5 flex-1 flex flex-col relative bg-gradient-to-b from-[#141414] to-[#0a0a0a]">
                  {/* Delete Button (visible on hover) */}
                  <button
                    onClick={() => handleDelete(content.id)}
                    className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-red-400 bg-red-400/10 hover:bg-red-400/20 p-2 rounded-lg"
                    title="Excluir Mídia"
                  >
                     <Trash2 className="w-4 h-4" />
                  </button>

                  <h3 className="font-semibold text-[15px] mb-2 text-white pr-6 leading-snug">{content.title}</h3>
                  <p className="text-xs text-gray-500 flex items-center gap-1.5 mb-5 font-medium">
                    <Calendar className="w-3.5 h-3.5" /> Entregue em {toDisplayDate(content.date)}
                  </p>

                  {content.feedback && (
                    <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-3.5 mb-5">
                      <p className="text-[11px] font-bold text-yellow-500 mb-1.5 flex items-center gap-1.5 uppercase tracking-wide">
                        <MessageSquare className="w-3.5 h-3.5" /> Feedback Solicitado
                      </p>
                      <p className="text-sm text-gray-300 italic leading-relaxed">"{content.feedback}"</p>
                    </div>
                  )}

                  <div className="mt-auto pt-4 flex flex-col gap-3">
                    {content.status === 'APROVADO' ? (
                      <button disabled className="w-full py-2.5 rounded-xl text-sm font-medium bg-green-500/10 text-green-400 border border-green-500/20 flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> Aprovado pelo Cliente
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => setWhatsappTarget(content.id)}
                          className="w-full py-2.5 rounded-xl text-sm font-bold text-black bg-emerald-500 border border-emerald-500 hover:bg-emerald-400 hover:border-emerald-400 flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)]"
                        >
                          <MessageCircle className="w-4 h-4 fill-black text-black" /> Notificar Cliente
                        </button>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => handleApprove(content.id)}
                            className="py-2.5 rounded-xl text-sm font-medium text-green-400 border border-green-500/20 hover:bg-green-500/10 flex items-center justify-center gap-2 transition-colors hover:border-green-500/40"
                          >
                            <CheckCircle2 className="w-4 h-4" /> Aprovar
                          </button>
                          <button
                            onClick={() => handleRequestChange(content.id)}
                            className="py-2.5 rounded-xl text-sm font-medium text-yellow-500 border border-yellow-500/20 hover:bg-yellow-500/10 flex items-center justify-center gap-2 transition-colors hover:border-yellow-500/40"
                          >
                            <MessageSquare className="w-4 h-4" /> Alteração
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredContents.length === 0 && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} className="col-span-full py-24 text-center text-gray-500 flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-[#141414] border border-[#222] flex items-center justify-center mb-4">
                 <ImageIcon className="w-8 h-8 text-gray-600" />
              </div>
              <h3 className="font-semibold text-gray-400 mb-1">Nenhum conteúdo encontrado</h3>
              <p className="text-sm">Não há itens para o filtro selecionado.</p>
            </motion.div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {whatsappTarget !== null && (
          <WhatsAppModal
            contentTitle={contents.find(c => c.id === whatsappTarget)?.title || ''}
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
        {showNovoModal && (
          <NovoConteudoModal onAdd={handleAddContent} onClose={() => setShowNovoModal(false)} />
        )}
      </AnimatePresence>
      <ToastContainer />
    </motion.div>
  );
};

export default AprovacaoConteudo;
