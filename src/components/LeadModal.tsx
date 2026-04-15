import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  X, Building2, Mail, Phone, Calendar,
  DollarSign, TagIcon, AlignLeft, Activity, Users, Send, Target, History
} from 'lucide-react';
import { Lead } from '../types';
import useEscapeKey from '../hooks/useEscapeKey';

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
  onUpdate: (id: string, updates: Partial<Lead>) => void;
}

export const LeadModal: React.FC<LeadModalProps> = ({
  isOpen, onClose, lead, onUpdate
}) => {
  useEscapeKey(onClose, isOpen);

  const [formData, setFormData] = useState<Partial<Lead>>({});
  const [newActivity, setNewActivity] = useState('');

  useEffect(() => {
    if (lead) {
      setFormData({
        title: lead.title || '',
        value: lead.value || 0,
        contactName: lead.contactName || '',
        email: lead.email || '',
        phone: lead.phone || '',
        source: lead.source || '',
        notes: lead.notes || '',
        tags: lead.tags || [],
      });
    }
  }, [lead]);

  if (!isOpen || !lead) return null;

  const handleChange = (field: keyof Lead, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    onUpdate(lead.id, { [field]: value });
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.currentTarget.value.trim() !== '') {
      e.preventDefault();
      const newTag = e.currentTarget.value.trim();
      const newTags = [...(formData.tags || []), newTag];
      setFormData(prev => ({ ...prev, tags: newTags }));
      onUpdate(lead.id, { tags: newTags });
      e.currentTarget.value = '';
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = (formData.tags || []).filter(t => t !== tagToRemove);
    setFormData(prev => ({ ...prev, tags: newTags }));
    onUpdate(lead.id, { tags: newTags });
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
        className="w-full max-w-5xl bg-[#141414] border border-[#333] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#2b2b2b]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
              <Building2 className="w-6 h-6 text-blue-500 shadow-inner" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                 <input
                   type="text"
                   value={formData.title || ''}
                   onChange={(e) => handleChange('title', e.target.value)}
                   className="bg-transparent text-xl font-bold text-white focus:outline-none focus:border-b border-blue-500 placeholder-gray-600 w-64"
                   placeholder="Nome da Empresa/Lead..."
                 />
                 <span className="bg-[#2b2b2b] text-gray-400 text-[10px] px-2 py-0.5 rounded font-medium uppercase tracking-wider">
                   {lead.source || 'Novo Lead'}
                 </span>
              </div>
              <div className="flex items-center gap-4 mt-2">
                <div className="text-sm text-green-500 flex items-center gap-1 font-bold bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
                  <DollarSign className="w-3.5 h-3.5" />
                  <input
                    type="number"
                    value={formData.value || ''}
                    onChange={(e) => handleChange('value', parseFloat(e.target.value))}
                    className="bg-transparent focus:outline-none w-24 text-green-500"
                  />
                </div>
                <div className="text-sm text-gray-500 flex items-center gap-1 font-medium">
                   <Calendar className="w-3.5 h-3.5 text-gray-400" /> Criado em: {lead.date}
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white bg-[#1e1e1e] hover:bg-[#2b2b2b] rounded-lg transition-colors border border-[#333]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Split */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Left Column (Data Form) */}
          <div className="w-full md:w-1/2 p-6 overflow-y-auto custom-scrollbar border-r border-[#2b2b2b] space-y-8 bg-[#0a0a0a]">
            {/* Contato Section */}
            <section>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" /> Informações de Contato
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3 bg-[#1e1e1e] border border-[#333] rounded-lg p-3 focus-within:border-primary/50 transition-colors">
                  <div className="text-gray-500"><Users className="w-4 h-4" /></div>
                  <input
                    type="text"
                    value={formData.contactName || ''}
                    onChange={(e) => handleChange('contactName', e.target.value)}
                    placeholder="Nome do Ponto de Contato"
                    className="bg-transparent flex-1 text-sm text-white focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-3 bg-[#1e1e1e] border border-[#333] rounded-lg p-3 focus-within:border-primary/50 transition-colors">
                  <div className="text-gray-500"><Mail className="w-4 h-4" /></div>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="Email Corporativo"
                    className="bg-transparent flex-1 text-sm text-white focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-3 bg-[#1e1e1e] border border-[#333] rounded-lg p-3 focus-within:border-primary/50 transition-colors">
                  <div className="text-gray-500"><Phone className="w-4 h-4" /></div>
                  <input
                    type="text"
                    value={formData.phone || ''}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="Telefone / WhatsApp"
                    className="bg-transparent flex-1 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>
            </section>

            {/* Tags / Meta */}
            <section>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-400" /> Origem & Segmentação
              </h3>
              <div className="bg-[#1e1e1e] border border-[#333] rounded-lg p-4 space-y-4">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Origem do Lead</label>
                  <select
                    value={formData.source || ''}
                    onChange={(e) => handleChange('source', e.target.value)}
                    className="w-full bg-[#141414] border border-[#2b2b2b] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50"
                  >
                    <option value="">Selecione a origem...</option>
                    <option value="Inbound">Inbound (Site / Ads)</option>
                    <option value="Outbound">Outbound (Prospecção Ativa)</option>
                    <option value="Indicação">Indicação de Cliente</option>
                    <option value="Evento">Evento / Network</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-gray-500 block mb-2">Tags / Nicho</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(formData.tags || []).map((tag, i) => (
                      <span
                        key={i}
                        className="text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-1.5 rounded flex items-center gap-1.5 uppercase tracking-wide"
                      >
                        {tag}
                        <button onClick={() => removeTag(tag)} className="hover:text-blue-200">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Adicione tag (ex: Saas, VIP) e tecle Enter..."
                    onKeyDown={handleAddTag}
                    className="w-full bg-[#141414] border border-[#2b2b2b] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
                  />
                </div>
              </div>
            </section>

            {/* Notes Section */}
            <section>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <AlignLeft className="w-4 h-4 text-orange-400" /> Anotações Base
              </h3>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Exigências, dores, budget..."
                className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg p-4 text-sm text-white focus:outline-none focus:border-orange-500/50 h-32 resize-none custom-scrollbar"
              />
            </section>
          </div>

          {/* Right Column (Activity Timeline) */}
          <div className="w-full md:w-1/2 flex flex-col bg-[#141414]">
            <div className="p-6 border-b border-[#2b2b2b]">
               <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                 <History className="w-4 h-4 text-emerald-500" /> Linha do Tempo e Atividades
               </h3>
               <p className="text-[11px] text-gray-500 mt-1">Registre interações, e-mails, e status.</p>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
              {/* Timeline feed */}
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-[#333] before:via-[#333] before:to-transparent">
                
                {/* Fixed "Creation" activity */}
                <div className="relative flex items-center">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border border-[#333] bg-[#1e1e1e] text-blue-500 shadow-md shrink-0 z-10 transition-transform hover:scale-110">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="ml-4 w-full bg-[#1e1e1e] p-4 rounded-xl border border-[#2b2b2b]">
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-bold text-gray-300 text-sm">Lead Criado</div>
                      <time className="font-medium text-[11px] text-gray-500">{lead.date}</time>
                    </div>
                    <div className="text-[12px] text-gray-400">Adicionado ao pipeline pela primeira vez.</div>
                  </div>
                </div>

                {/* Dynamic activities */}
                {(lead.activities || []).map((act, i) => (
                  <div key={i} className="relative flex items-center group">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-[#333] bg-[#1e1e1e] text-gray-400 shadow-md shrink-0 z-10 transition-transform group-hover:scale-110 group-hover:text-emerald-500 group-hover:border-emerald-500/50">
                      {act.type === 'note' ? <AlignLeft className="w-4 h-4" /> : 
                       act.type === 'status_change' ? <Target className="w-4 h-4" /> : 
                       <Activity className="w-4 h-4" />}
                    </div>
                    <div className="ml-4 w-full bg-[#1e1e1e] p-4 rounded-xl border border-[#2b2b2b] group-hover:border-[#444] transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-bold text-gray-200 text-sm">{act.content}</div>
                        <time className="font-medium text-[11px] text-gray-500">{act.date}</time>
                      </div>
                      {act.type === 'note' && <div className="text-[12px] text-gray-400 mt-2 bg-[#0a0a0a] p-3 rounded-lg border border-[#333] italic">Anotação rápida registrada.</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Input para nova atividade */}
            <div className="p-4 border-t border-[#2b2b2b] bg-[#0a0a0a]">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Registrar nova atividade ou nota..."
                  value={newActivity}
                  onChange={e => setNewActivity(e.target.value)}
                  onKeyDown={e => {
                    if(e.key === 'Enter' && newActivity.trim() !== '') {
                      const newAct = {
                        id: `act-${Date.now()}`,
                        type: 'note' as const,
                        content: newActivity.trim(),
                        date: new Date().toISOString().split('T')[0]
                      };
                      const activities = [...(lead.activities || []), newAct];
                      handleChange('activities', activities);
                      setNewActivity('');
                    }
                  }}
                  className="w-full bg-[#1e1e1e] border border-[#333] rounded-xl pl-4 pr-12 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <button 
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-[#2b2b2b] hover:bg-emerald-500 hover:text-white text-gray-400 rounded-lg transition-colors"
                  onClick={() => {
                    if(newActivity.trim() !== '') {
                      const newAct = {
                        id: `act-${Date.now()}`,
                        type: 'note' as const,
                        content: newActivity.trim(),
                        date: new Date().toISOString().split('T')[0]
                      };
                      const activities = [...(lead.activities || []), newAct];
                      handleChange('activities', activities);
                      setNewActivity('');
                    }
                  }}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        </div>
      </motion.div>
    </div>
  );
};
