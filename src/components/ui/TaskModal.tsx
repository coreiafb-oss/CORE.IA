import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Flag, Calendar, Users, Tag as TagIcon, Paperclip,
  Link2, MessageSquare, Send, Trash2, Plus, CheckCircle2,
  Clock, AlertCircle, ChevronDown, Image as ImageIcon, FileText, Video
} from 'lucide-react';
import { Task, Priority, TaskComment, TaskAttachment } from '../../types';
import { useAppContext, SYSTEM_USERS } from '../../context/AppContext';

interface TaskModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
}

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; icon: string }> = {
  Urgent: { label: 'Urgente',  color: 'text-red-400',    icon: '🔴' },
  High:   { label: 'Alta',     color: 'text-yellow-400', icon: '🟡' },
  Normal: { label: 'Normal',   color: 'text-blue-400',   icon: '🔵' },
  Low:    { label: 'Baixa',    color: 'text-gray-400',   icon: '⚪' },
  None:   { label: 'Nenhuma',  color: 'text-gray-600',   icon: '—'  },
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};

const formatBytes = (bytes?: number) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const AttachmentIcon = ({ type }: { type: string }) => {
  if (type === 'image') return <ImageIcon className="w-4 h-4 text-blue-400" />;
  if (type === 'video') return <Video className="w-4 h-4 text-purple-400" />;
  return <FileText className="w-4 h-4 text-gray-400" />;
};

// ─── TaskModal ────────────────────────────────────────────────────────────────
export const TaskModal: React.FC<TaskModalProps> = ({ task, isOpen, onClose }) => {
  const { updateTask, addComment, addAttachment, removeAttachment, taskStatuses, tasks } = useAppContext();

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleVal, setTitleVal] = useState(task.name);
  const [descVal, setDescVal] = useState(task.description || '');
  const [editingDesc, setEditingDesc] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'attachments'>('details');
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showAssigneeMenu, setShowAssigneeMenu] = useState(false);
  const [dueDateVal, setDueDateVal] = useState(task.dueDate || '');
  const [relatedInput, setRelatedInput] = useState('');
  const [showRelatedSearch, setShowRelatedSearch] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const currentStatus = taskStatuses.find(s => s.id === task.statusId);
  const priorityConf = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.None;

  // Sync local state when task changes from outside
  useEffect(() => {
    setTitleVal(task.name);
    setDescVal(task.description || '');
    setDueDateVal(task.dueDate || '');
  }, [task.id, task.name, task.description, task.dueDate]);

  // Scroll to bottom of comments
  useEffect(() => {
    if (activeTab === 'comments') {
      commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [task.comments?.length, activeTab]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleTitleSave = () => {
    if (titleVal.trim()) updateTask(task.id, { name: titleVal.trim() });
    setEditingTitle(false);
  };

  const handleDescSave = () => {
    updateTask(task.id, { description: descVal });
    setEditingDesc(false);
  };

  const handleSendComment = () => {
    if (!commentText.trim()) return;
    addComment(task.id, commentText.trim());
    setCommentText('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const type = file.type.startsWith('image/') ? 'image'
               : file.type.startsWith('video/') ? 'video'
               : file.type === 'application/pdf' ? 'pdf'
               : 'file';
    const url = URL.createObjectURL(file);
    addAttachment(task.id, { name: file.name, url, type, size: file.size });
    e.target.value = '';
  };

  const toggleAssignee = (avatar: string) => {
    const current = task.assignees || [];
    const next = current.includes(avatar)
      ? current.filter(a => a !== avatar)
      : [...current, avatar];
    updateTask(task.id, { assignees: next });
  };

  const addRelatedTask = (relId: string) => {
    if (relId === task.id) return;
    const current = task.relatedTaskIds || [];
    if (!current.includes(relId)) {
      updateTask(task.id, { relatedTaskIds: [...current, relId] });
    }
    setRelatedInput('');
    setShowRelatedSearch(false);
  };

  const removeRelatedTask = (relId: string) => {
    updateTask(task.id, { relatedTaskIds: (task.relatedTaskIds || []).filter(id => id !== relId) });
  };

  const addTag = () => {
    if (!tagInput.trim()) return;
    const existing = task.tags || [];
    const colors = ['#e31837', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899'];
    const bg = ['#e3183720', '#3b82f620', '#8b5cf620', '#10b98120', '#f59e0b20', '#ec489920'];
    const i = existing.length % colors.length;
    updateTask(task.id, {
      tags: [...existing, { name: tagInput.trim(), color: colors[i], bgColor: bg[i] }]
    });
    setTagInput('');
  };

  const removeTag = (tagName: string) => {
    updateTask(task.id, { tags: (task.tags || []).filter(t => t.name !== tagName) });
  };

  const relatedTasks = tasks.filter(t =>
    (task.relatedTaskIds || []).includes(t.id)
  );

  const searchableTasks = tasks.filter(t =>
    t.id !== task.id &&
    !(task.relatedTaskIds || []).includes(t.id) &&
    relatedInput.length > 0 &&
    t.name.toLowerCase().includes(relatedInput.toLowerCase())
  ).slice(0, 5);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="pointer-events-auto w-full max-w-5xl max-h-[90vh] flex rounded-2xl overflow-hidden shadow-2xl border border-white/[0.06]"
              style={{ background: 'var(--surface-1)' }}
              onClick={e => e.stopPropagation()}
            >
              {/* ── Coluna Principal (conteúdo) ─────────────────────────── */}
              <div className="flex-1 flex flex-col min-w-0 border-r border-white/[0.06]">
                {/* Cabeçalho */}
                <div className="flex items-start gap-3 px-6 pt-5 pb-4 border-b border-white/[0.06] flex-shrink-0">
                  {/* Status badge */}
                  <button
                    onClick={() => setShowStatusMenu(!showStatusMenu)}
                    className="relative mt-0.5 flex-shrink-0"
                  >
                    <div
                      className="w-4 h-4 rounded border-2 flex items-center justify-center"
                      style={{ borderColor: currentStatus?.color || '#555' }}
                    >
                      <CheckCircle2 className="w-2.5 h-2.5" style={{ color: currentStatus?.color }} />
                    </div>
                    {showStatusMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute top-full left-0 mt-1 bg-[#1e1e1e] border border-[#333] rounded-xl shadow-2xl z-50 w-48 py-1 overflow-hidden"
                      >
                        {taskStatuses.map(s => (
                          <button
                            key={s.id}
                            onClick={(e) => { e.stopPropagation(); updateTask(task.id, { statusId: s.id }); setShowStatusMenu(false); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-white/5 transition-colors"
                          >
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                            {s.name}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </button>

                  {/* Título */}
                  <div className="flex-1 min-w-0">
                    {editingTitle ? (
                      <input
                        ref={titleRef}
                        autoFocus
                        value={titleVal}
                        onChange={e => setTitleVal(e.target.value)}
                        onBlur={handleTitleSave}
                        onKeyDown={e => { if (e.key === 'Enter') handleTitleSave(); if (e.key === 'Escape') setEditingTitle(false); }}
                        className="w-full bg-transparent text-white text-xl font-semibold outline-none border-b border-primary/50 pb-1"
                      />
                    ) : (
                      <h2
                        className="text-xl font-semibold text-white cursor-pointer hover:text-gray-200 transition-colors line-clamp-2"
                        onClick={() => setEditingTitle(true)}
                      >
                        {task.name}
                      </h2>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded text-white"
                        style={{ backgroundColor: currentStatus?.color || '#555' }}
                      >
                        {currentStatus?.name || 'Sem status'}
                      </span>
                      {task.createdAt && (
                        <span className="text-[10px] text-gray-500">
                          Criada em {formatDate(task.createdAt)}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={onClose}
                    className="flex-shrink-0 p-1.5 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/[0.06] flex-shrink-0 px-6">
                  {(['details', 'comments', 'attachments'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide transition-colors border-b-2 -mb-px ${
                        activeTab === tab
                          ? 'text-white border-primary'
                          : 'text-gray-500 border-transparent hover:text-gray-300'
                      }`}
                    >
                      {tab === 'details' && 'Detalhes'}
                      {tab === 'comments' && `Comentários${task.comments?.length ? ` (${task.comments.length})` : ''}`}
                      {tab === 'attachments' && `Anexos${task.attachments?.length ? ` (${task.attachments.length})` : ''}`}
                    </button>
                  ))}
                </div>

                {/* Conteúdo das tabs */}
                <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-5">

                  {/* ── Tab: Detalhes ───────────────────────────────────── */}
                  {activeTab === 'details' && (
                    <div className="space-y-6">
                      {/* Descrição */}
                      <div>
                        <label className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider mb-2 block">
                          Descrição
                        </label>
                        {editingDesc ? (
                          <div>
                            <textarea
                              autoFocus
                              value={descVal}
                              onChange={e => setDescVal(e.target.value)}
                              rows={5}
                              placeholder="Adicione uma descrição..."
                              className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-primary/50 placeholder-gray-600 resize-none"
                            />
                            <div className="flex gap-2 mt-2">
                              <button onClick={handleDescSave} className="px-3 py-1.5 bg-primary text-white text-xs rounded-lg font-medium">Salvar</button>
                              <button onClick={() => { setEditingDesc(false); setDescVal(task.description || ''); }} className="px-3 py-1.5 text-gray-400 text-xs hover:text-white">Cancelar</button>
                            </div>
                          </div>
                        ) : (
                          <div
                            className="min-h-[60px] cursor-pointer rounded-lg p-3 hover:bg-white/[0.03] border border-transparent hover:border-white/[0.06] transition-all"
                            onClick={() => setEditingDesc(true)}
                          >
                            {task.description ? (
                              <p className="text-sm text-gray-300 whitespace-pre-wrap">{task.description}</p>
                            ) : (
                              <p className="text-sm text-gray-600 italic">Clique para adicionar uma descrição...</p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Tags */}
                      <div>
                        <label className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider mb-2 block">
                          Tags
                        </label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {(task.tags || []).map(tag => (
                            <span
                              key={tag.name}
                              className="flex items-center gap-1 px-2 py-1 text-[11px] font-bold rounded border group cursor-pointer"
                              style={{ color: tag.color, backgroundColor: tag.bgColor, borderColor: tag.color + '40' }}
                            >
                              {tag.name}
                              <X
                                className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => removeTag(tag.name)}
                              />
                            </span>
                          ))}
                          <div className="flex items-center gap-1">
                            <input
                              value={tagInput}
                              onChange={e => setTagInput(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') addTag(); }}
                              placeholder="+ Tag"
                              className="bg-transparent border border-dashed border-[#444] rounded px-2 py-1 text-[11px] text-gray-400 outline-none focus:border-gray-400 w-20 placeholder-gray-600"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Tarefas Relacionadas */}
                      <div>
                        <label className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider mb-2 block">
                          Tarefas Relacionadas
                        </label>
                        <div className="space-y-1.5 mb-2">
                          {relatedTasks.map(rt => {
                            const rtStatus = taskStatuses.find(s => s.id === rt.statusId);
                            return (
                              <div key={rt.id} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.03] border border-white/[0.06] group">
                                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: rtStatus?.color || '#555' }} />
                                <span className="text-sm text-gray-300 flex-1 truncate">{rt.name}</span>
                                <button
                                  onClick={() => removeRelatedTask(rt.id)}
                                  className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                        <div className="relative">
                          <input
                            value={relatedInput}
                            onChange={e => { setRelatedInput(e.target.value); setShowRelatedSearch(true); }}
                            onFocus={() => setShowRelatedSearch(true)}
                            placeholder="Buscar tarefa para vincular..."
                            className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-sm text-gray-300 outline-none focus:border-primary/50 placeholder-gray-600"
                          />
                          {showRelatedSearch && searchableTasks.length > 0 && (
                            <div className="absolute top-full mt-1 left-0 right-0 bg-[#1e1e1e] border border-[#333] rounded-xl shadow-2xl z-30 overflow-hidden">
                              {searchableTasks.map(rt => (
                                <button
                                  key={rt.id}
                                  onClick={() => addRelatedTask(rt.id)}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/5 transition-colors text-left"
                                >
                                  <Link2 className="w-3.5 h-3.5 text-gray-500" />
                                  {rt.name}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── Tab: Comentários ─────────────────────────────────── */}
                  {activeTab === 'comments' && (
                    <div className="flex flex-col gap-4">
                      {(task.comments || []).length === 0 && (
                        <div className="text-center py-12 text-gray-600">
                          <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
                          <p className="text-sm">Nenhum comentário ainda.</p>
                          <p className="text-xs mt-1">Seja o primeiro a comentar.</p>
                        </div>
                      )}
                      {(task.comments || []).map(comment => (
                        <div key={comment.id} className="flex gap-3">
                          <img src={comment.authorAvatar} alt={comment.authorName} className="w-8 h-8 rounded-full flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-semibold text-white">{comment.authorName}</span>
                              <span className="text-[11px] text-gray-500">{formatDate(comment.createdAt)}</span>
                            </div>
                            <div className="bg-[#1a1a1a] border border-white/[0.06] rounded-xl px-3 py-2.5 text-sm text-gray-300 whitespace-pre-wrap">
                              {comment.content}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={commentsEndRef} />
                    </div>
                  )}

                  {/* ── Tab: Anexos ───────────────────────────────────────── */}
                  {activeTab === 'attachments' && (
                    <div>
                      {(task.attachments || []).length === 0 && (
                        <div className="text-center py-12 text-gray-600">
                          <Paperclip className="w-10 h-10 mx-auto mb-3 opacity-30" />
                          <p className="text-sm">Nenhum anexo ainda.</p>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-3">
                        {(task.attachments || []).map(att => (
                          <div
                            key={att.id}
                            className="group flex items-center gap-3 p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl hover:border-white/[0.12] transition-colors"
                          >
                            {att.type === 'image' && att.url ? (
                              <img src={att.url} alt={att.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                                <AttachmentIcon type={att.type} />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-200 truncate font-medium">{att.name}</p>
                              <p className="text-[11px] text-gray-500">{formatBytes(att.size)}</p>
                            </div>
                            <button
                              onClick={() => removeAttachment(task.id, att.id)}
                              className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-4 w-full border border-dashed border-[#333] rounded-xl py-4 text-sm text-gray-500 hover:text-gray-300 hover:border-[#555] transition-colors flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Adicionar Anexo
                      </button>
                      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
                    </div>
                  )}
                </div>

                {/* Caixa de comentário (fixa na base, só na tab comments) */}
                {activeTab === 'comments' && (
                  <div className="px-6 py-4 border-t border-white/[0.06] flex-shrink-0">
                    <div className="flex items-end gap-3">
                      <img src="https://i.pravatar.cc/150?img=11" alt="me" className="w-8 h-8 rounded-full flex-shrink-0 mb-0.5" />
                      <div className="flex-1 relative">
                        <textarea
                          value={commentText}
                          onChange={e => setCommentText(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendComment(); } }}
                          placeholder="Adicionar comentário... (Enter para enviar)"
                          rows={2}
                          className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-primary/50 placeholder-gray-600 resize-none pr-12"
                        />
                        <button
                          onClick={handleSendComment}
                          disabled={!commentText.trim()}
                          className="absolute right-2 bottom-2 p-1.5 text-primary hover:bg-primary/10 rounded-lg disabled:opacity-30 transition-all"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Sidebar de metadados ──────────────────────────────────── */}
              <div className="w-72 flex-shrink-0 flex flex-col overflow-y-auto custom-scrollbar" style={{ background: 'var(--surface-2)' }}>
                <div className="p-5 space-y-5">
                  <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Detalhes da Tarefa</h3>

                  {/* Status */}
                  <MetaItem label="Status" icon={<CheckCircle2 className="w-3.5 h-3.5" />}>
                    <div className="relative">
                      <button
                        onClick={() => setShowStatusMenu(!showStatusMenu)}
                        className="flex items-center gap-2 text-sm text-white"
                      >
                        <span
                          className="px-2 py-0.5 rounded text-[11px] font-bold text-white"
                          style={{ backgroundColor: currentStatus?.color || '#555' }}
                        >
                          {currentStatus?.name || 'Sem status'}
                        </span>
                        <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                      </button>
                      {showStatusMenu && (
                        <motion.div
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="absolute left-0 top-full mt-1 bg-[#1e1e1e] border border-[#333] rounded-xl shadow-2xl z-50 w-48 py-1"
                        >
                          {taskStatuses.map(s => (
                            <button
                              key={s.id}
                              onClick={() => { updateTask(task.id, { statusId: s.id }); setShowStatusMenu(false); }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-white/5 transition-colors"
                            >
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                              {s.name}
                          </button>
                          ))}
                        </motion.div>
                      )}
                    </div>
                  </MetaItem>

                  {/* Prioridade */}
                  <MetaItem label="Prioridade" icon={<Flag className="w-3.5 h-3.5" />}>
                    <div className="relative">
                      <button
                        onClick={() => setShowPriorityMenu(!showPriorityMenu)}
                        className={`flex items-center gap-1.5 text-sm font-medium ${priorityConf.color}`}
                      >
                        <span>{priorityConf.icon}</span>
                        {priorityConf.label}
                        <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                      </button>
                      {showPriorityMenu && (
                        <motion.div
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="absolute left-0 top-full mt-1 bg-[#1e1e1e] border border-[#333] rounded-xl shadow-2xl z-50 w-40 py-1"
                        >
                          {(Object.entries(PRIORITY_CONFIG) as [Priority, typeof PRIORITY_CONFIG[Priority]][]).map(([key, conf]) => (
                            <button
                              key={key}
                              onClick={() => { updateTask(task.id, { priority: key }); setShowPriorityMenu(false); }}
                              className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-white/5 transition-colors ${conf.color}`}
                            >
                              <span>{conf.icon}</span> {conf.label}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </div>
                  </MetaItem>

                  {/* Data de Entrega */}
                  <MetaItem label="Data de Entrega" icon={<Calendar className="w-3.5 h-3.5" />}>
                    <input
                      type="date"
                      value={dueDateVal}
                      onChange={e => { setDueDateVal(e.target.value); updateTask(task.id, { dueDate: e.target.value }); }}
                      className="bg-transparent text-sm text-gray-300 outline-none cursor-pointer [color-scheme:dark]"
                    />
                  </MetaItem>

                  {/* Responsáveis */}
                  <MetaItem label="Responsáveis" icon={<Users className="w-3.5 h-3.5" />}>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-1 flex-wrap">
                        {SYSTEM_USERS.filter(u => task.assignees?.includes(u.avatar)).map(u => (
                          <div key={u.id} className="relative group/avatar">
                            <img src={u.avatar} alt={u.name} className="w-7 h-7 rounded-full border-2 border-[#1a1a1a]" />
                            <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#111] text-white text-[10px] px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover/avatar:opacity-100 transition-opacity pointer-events-none z-10">
                              {u.name}
                            </div>
                          </div>
                        ))}
                        <div className="relative">
                          <button
                            onClick={() => setShowAssigneeMenu(!showAssigneeMenu)}
                            className="w-7 h-7 rounded-full border-2 border-dashed border-[#444] flex items-center justify-center text-gray-500 hover:border-gray-400 hover:text-gray-300 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          {showAssigneeMenu && (
                            <motion.div
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="absolute left-0 top-full mt-1 bg-[#1e1e1e] border border-[#333] rounded-xl shadow-2xl z-50 w-44 py-1"
                            >
                              {SYSTEM_USERS.map(u => (
                                <button
                                  key={u.id}
                                  onClick={() => toggleAssignee(u.avatar)}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-white/5 transition-colors"
                                >
                                  <img src={u.avatar} alt={u.name} className="w-5 h-5 rounded-full" />
                                  {u.name}
                                  {task.assignees?.includes(u.avatar) && (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-primary ml-auto" />
                                  )}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </div>
                  </MetaItem>

                  {/* Anexar arquivo rápido */}
                  <MetaItem label="Anexar Arquivo" icon={<Paperclip className="w-3.5 h-3.5" />}>
                    <button
                      onClick={() => { fileInputRef.current?.click(); setActiveTab('attachments'); }}
                      className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Adicionar
                    </button>
                    <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
                  </MetaItem>

                  {/* Linha separadora */}
                  <div className="border-t border-white/[0.06]" />

                  {/* Estatísticas rápidas */}
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Atividade</h4>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Comentários</span>
                      <span className="font-medium text-gray-300">{task.comments?.length || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Anexos</span>
                      <span className="font-medium text-gray-300">{task.attachments?.length || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Relacionadas</span>
                      <span className="font-medium text-gray-300">{task.relatedTaskIds?.length || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// ─── Componente auxiliar MetaItem ────────────────────────────────────────────
const MetaItem: React.FC<{ label: string; icon: React.ReactNode; children: React.ReactNode }> = ({ label, icon, children }) => (
  <div className="space-y-1.5">
    <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-semibold uppercase tracking-wider">
      {icon}
      {label}
    </div>
    {children}
  </div>
);

export default TaskModal;
