import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, MessageSquare, Play, FileText, Image as ImageIcon, Music, Download } from 'lucide-react';
import { ContentItem } from '../types';
import { useAppContext } from '../context/AppContext';
import { useToast } from './Toast';

// Mock data integration: In a real app, this would fetch from an API using an ID in the URL.
// We'll simulate receiving a single content item or list of items.

const ApprovalClientView = () => {
  const { contentItems, setContentItems } = useAppContext(); 
  // O ideal seria que este componente pudesse funcionar sem o AppContext completo, buscando por API.
  // Como estamos sem backend real, usaremos o contexto (o que exige estar logado ou injetar dados).
  // Para fins de demonstração da interface pública "External Route", vamos renderizar o que há no pendente.

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ContentItem[]>([]);
  const { showToast, ToastContainer } = useToast();
  const [feedbackTarget, setFeedbackTarget] = useState<string | number | null>(null);
  const [feedbackText, setFeedbackText] = useState('');

  useEffect(() => {
    // Simulando loading de uma rota externa
    setTimeout(() => {
      setItems(contentItems.filter(c => c.status === 'PENDENTE' || c.status === 'REVISÃO'));
      setLoading(false);
    }, 800);
  }, [contentItems]);

  const handleApprove = (id: string | number) => {
    setContentItems(prev => prev.map(c => c.id === id ? { ...c, status: 'APROVADO', feedback: null } : c));
    showToast('Pronto! Material aprovado com sucesso.', 'success');
  };

  const submitFeedback = () => {
    if (!feedbackTarget || !feedbackText.trim()) return;
    setContentItems(prev => prev.map(c => c.id === feedbackTarget ? { ...c, status: 'REVISÃO', feedback: feedbackText } : c));
    showToast('Sua solicitação de alteração foi enviada para a equipe.', 'success');
    setFeedbackTarget(null);
    setFeedbackText('');
  };

  if (loading) {
     return (
        <div className="min-h-screen bg-[#050507] flex items-center justify-center">
            <div className="w-8 h-8 md:w-12 md:h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
     )
  }

  return (
    <div className="min-h-screen bg-[#050507] text-white p-4 sm:p-8 font-sans flex justify-center">
      <div className="w-full max-w-4xl max-h-full">
        {/* Header Public */}
        <div className="text-center mb-10">
           <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">Portal de Aprovação</h1>
           <p className="text-gray-400 text-sm sm:text-base max-w-2xl mx-auto">
             Revise os materiais produzidos pela nossa equipe. Caso queira, você pode baixar para ver em detalhes, aprovar ou solicitar alterações.
           </p>
        </div>

        {items.length === 0 ? (
           <div className="bg-[#111] border border-[#222] rounded-2xl p-12 text-center flex flex-col items-center">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4" />
              <h2 className="text-xl font-bold mb-2">Tudo em dia!</h2>
              <p className="text-gray-400 text-sm">Não há mídias aguardando a sua aprovação no momento.</p>
           </div>
        ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
             {items.map(content => (
               <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={content.id}
                  className="bg-[#111] border border-[#222] rounded-2xl overflow-hidden shadow-2xl flex flex-col"
               >
                 {/* Thumbnail Area */}
                 <div className={`relative aspect-video flex items-center justify-center ${content.color} overflow-hidden group`}>
                    {content.fileUrl ? (
                      content.type === 'image' ? (
                        <img src={content.fileUrl} className="w-full h-full object-cover opacity-90" />
                      ) : content.type === 'video' ? (
                        <video src={content.fileUrl} controls className="w-full h-full object-cover" />
                      ) : null
                    ) : (
                       <div className="flex flex-col items-center justify-center opacity-70">
                          <Play className="w-10 h-10 mb-2" />
                          <span className="text-xs font-bold uppercase">Mídia de Exemplo</span>
                       </div>
                    )}
                 </div>

                 {/* Info & Actions */}
                 <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-lg font-bold mb-1">{content.title}</h3>
                    <p className="text-xs text-gray-500 font-medium mb-6 uppercase tracking-wider">{content.type}</p>

                    {feedbackTarget === content.id ? (
                       <div className="mt-auto space-y-3 animate-in fade-in slide-in-from-bottom-2">
                          <textarea
                            autoFocus
                            value={feedbackText}
                            onChange={(e) => setFeedbackText(e.target.value)}
                            placeholder="Descreva as alterações..."
                            className="w-full bg-black/40 border border-[#333] rounded-xl p-3 text-sm focus:outline-none focus:border-yellow-500 resize-none h-24"
                          />
                          <div className="flex gap-2">
                            <button onClick={() => setFeedbackTarget(null)} className="flex-1 py-2 rounded-lg text-xs font-bold text-gray-400 bg-[#222] hover:bg-[#333]">Cancelar</button>
                            <button onClick={submitFeedback} className="flex-[2] py-2 rounded-lg text-xs font-bold text-black bg-yellow-500 hover:bg-yellow-400">Enviar Pedido</button>
                          </div>
                       </div>
                    ) : (
                       <div className="mt-auto grid grid-cols-2 gap-3">
                         <button 
                           onClick={() => setFeedbackTarget(content.id)}
                           className="py-3 rounded-xl text-sm font-bold text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 hover:bg-yellow-500/20 flex items-center justify-center gap-2 transition-colors"
                         >
                            <MessageSquare className="w-4 h-4" /> Alteração
                         </button>
                         <button 
                           onClick={() => handleApprove(content.id)}
                           className="py-3 rounded-xl text-sm font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 flex items-center justify-center gap-2 transition-colors"
                         >
                            <CheckCircle2 className="w-4 h-4" /> Aprovar
                         </button>
                       </div>
                    )}
                 </div>
               </motion.div>
             ))}
           </div>
        )}
      </div>
      <ToastContainer />
    </div>
  );
};

export default ApprovalClientView;
