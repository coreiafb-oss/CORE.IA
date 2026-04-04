import React, { useState, useCallback } from 'react';
import { Play, Clock, ChevronRight, BookOpen, X, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import useEscapeKey from '../hooks/useEscapeKey';
import { useAppContext } from '../context/AppContext';
import { academyTracks } from '../data';

const Academy = () => {
  const [activeVideo, setActiveVideo] = useState<{ id: string, title: string } | null>(null);
  const { watchedVideos, toggleVideoWatched } = useAppContext();

  // For Escape key closing
  const closeVideo = useCallback(() => setActiveVideo(null), []);
  useEscapeKey(closeVideo, !!activeVideo);

  const openVideo = (id: string, title: string) => {
    setActiveVideo({ id, title });
  };

  const getProgress = (id: number, total: number) => {
    const watched = watchedVideos.filter(v => v.startsWith(`trilha-${id}`)).length;
    // Mock simulation: If you watched the trilha itself it counts as 1. For a real app, you'd map individual videos per trilha.
    // Here we'll just simulate progress based on if the trilha ID was "watched" directly or via its main hero video.
    const isTrilhaWatched = watchedVideos.includes(`trilha-${id}`);
    return isTrilhaWatched ? 100 : 0; // Simple binary for now, can be expanded.
  };

  // Fake stats for hero
  const heroId = 'hero-kickoff';
  const isHeroWatched = watchedVideos.includes(heroId);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 lg:p-8 h-full overflow-auto text-white"
      style={{ background: 'var(--surface-0)' }}
    >
      <div className="max-w-[1400px] mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-1 tracking-tight">LINE Academy</h1>
            <p className="text-zinc-500 text-[13px]">Base de conhecimento e treinamentos internos para nivelamento da equipe.</p>
          </div>
          <div className="bg-[#141414] border border-[#222] px-4 py-2 rounded-lg flex items-center gap-3 shadow-lg">
             <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-red-500" />
             </div>
             <div>
                <div className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Aulas Concluídas</div>
                <div className="text-sm font-semibold">{watchedVideos.length}</div>
             </div>
          </div>
        </div>

        {/* Hero */}
        <div 
          className="relative rounded-2xl overflow-hidden mb-12 flex flex-col md:aspect-[21/9] min-h-[350px] group cursor-pointer border border-[#222] hover:border-red-500/30 transition-colors shadow-2xl"
          onClick={() => openVideo(heroId, 'Como conduzir uma Reunião de Kickoff Perfeita')}
        >
          <img 
            src="https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2070&auto=format&fit=crop" 
            alt="Hero" 
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent"></div>
          
          <div className="absolute inset-0 p-10 flex flex-col justify-center max-w-2xl z-10">
            <div className="flex items-center gap-3 mb-5">
              <span className="bg-red-600/20 text-red-500 border border-red-500/30 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider backdrop-blur-sm">Novo Lançamento</span>
              <span className="text-gray-300 text-xs font-medium flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10">
                 <Clock className="w-3.5 h-3.5" /> 45 min
              </span>
              {isHeroWatched && (
                 <span className="text-green-400 text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1 bg-green-500/10 border border-green-500/20">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Concluído
                 </span>
              )}
            </div>
            <h2 className="text-4xl font-bold mb-4 leading-tight drop-shadow-lg">Como conduzir uma Reunião de Kickoff Perfeita</h2>
            <p className="text-gray-300 text-sm leading-relaxed mb-8 max-w-xl font-medium">
              Aprenda o passo a passo exato que utilizamos na agência para encantar o cliente na primeira reunião e alinhar todas as expectativas do projeto de forma profissional.
            </p>
            <button className="bg-white text-black px-6 py-3 rounded-lg font-bold flex items-center gap-2 w-fit hover:bg-gray-200 hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)]">
              <Play className="w-4 h-4 fill-black" /> {isHeroWatched ? 'Assistir Novamente' : 'Assistir Agora'}
            </button>
          </div>
        </div>

        {/* Trilhas */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-red-500" /> Trilhas de Conhecimento
          </h3>
          <button className="text-sm font-medium text-gray-400 hover:text-white flex items-center gap-1 transition-colors">
            Ver todas trilhas <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {academyTracks.map((trilha) => {
             const trilhaId = `trilha-${trilha.id}`;
             const isWatched = watchedVideos.includes(trilhaId);
             
             return (
               <motion.div 
                 key={trilha.id} 
                 whileHover={{ y: -5 }}
                 className="group cursor-pointer bg-[#141414] border border-[#222] rounded-2xl overflow-hidden hover:border-red-500/30 transition-all shadow-lg"
                 onClick={() => openVideo(trilhaId, `Trilha: ${trilha.title}`)}
               >
                 <div className="relative aspect-video overflow-hidden shrink-0">
                   <img src={trilha.img} alt={trilha.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-100" />
                   <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/20 to-transparent"></div>
                   
                   <div className="absolute inset-0 flex items-center justify-center">
                     <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform scale-75 group-hover:scale-100 shadow-[0_0_15px_rgba(0,0,0,0.5)] border border-white/20">
                       <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                     </div>
                   </div>

                   {isWatched && (
                     <div className="absolute top-3 right-3 bg-green-500/90 text-white p-1 rounded-full shadow-lg backdrop-blur-sm">
                        <CheckCircle2 className="w-4 h-4" />
                     </div>
                   )}
                 </div>
                 
                 <div className="p-5 flex flex-col flex-1 min-h-[140px] relative">
                   <h4 className="font-semibold text-[15px] group-hover:text-red-400 transition-colors mb-2 pr-4 leading-tight">{trilha.title}</h4>
                   <div className="flex items-center gap-3 mt-auto text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-3">
                     <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {trilha.duration}</span>
                     <span className="flex items-center gap-1.5"><Play className="w-3.5 h-3.5" /> {trilha.videos} aulas</span>
                   </div>
                   
                   {/* Barra de Progresso Mock */}
                   <div className="w-full h-1.5 bg-[#222] rounded-full overflow-hidden mt-auto">
                      <div 
                        className={`h-full transition-all duration-1000 ${isWatched ? 'bg-green-500' : 'bg-red-500'}`} 
                        style={{ width: isWatched ? '100%' : '0%' }} 
                      />
                   </div>
                 </div>
               </motion.div>
             )
          })}
        </div>
      </div>

      {/* Video Modal */}
      <AnimatePresence>
        {activeVideo && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: -10 }}
              className="bg-[#141414] border border-[#333] rounded-2xl overflow-hidden w-full max-w-5xl shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-5 border-b border-[#222]">
                <h3 className="font-semibold text-lg text-white flex items-center gap-3">
                   <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center border border-red-500/20">
                      <Play className="w-4 h-4 text-red-500 fill-red-500" />
                   </div>
                   {activeVideo.title}
                </h3>
                <div className="flex items-center gap-3">
                   <button 
                     onClick={() => toggleVideoWatched(activeVideo.id)}
                     className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors border ${
                        watchedVideos.includes(activeVideo.id) 
                           ? 'bg-green-500/10 text-green-500 border-green-500/30 hover:bg-green-500/20' 
                           : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'
                     }`}
                   >
                     <CheckCircle2 className="w-4 h-4" /> 
                     {watchedVideos.includes(activeVideo.id) ? 'Concluída' : 'Marcar como Concluída'}
                   </button>
                   <button 
                     onClick={closeVideo}
                     className="p-2 bg-white/5 hover:bg-red-500/20 hover:text-red-500 rounded-lg transition-colors text-gray-400"
                   >
                     <X className="w-5 h-5" />
                   </button>
                </div>
              </div>
              <div className="aspect-video bg-black flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-red-900/20 to-black pointer-events-none" />
                <div className="absolute inset-0 flex items-center justify-center flex-col gap-6 z-10">
                  <div className="w-24 h-24 rounded-full bg-red-600/20 flex items-center justify-center animate-[pulse_3s_ease-in-out_infinite] border border-red-500/30 backdrop-blur-sm">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.5)]">
                      <Play className="w-8 h-8 text-white fill-white ml-1" />
                    </div>
                  </div>
                  <div className="text-center">
                     <p className="text-white font-semibold text-lg mb-1">Simulação de Vídeo Iniciada</p>
                     <p className="text-gray-400 text-sm">Este é um placeholder para o player de vídeo real.</p>
                  </div>
                </div>
              </div>
              <div className="p-6 bg-[#0a0a0a] overflow-y-auto">
                <h4 className="font-semibold text-white mb-2 text-lg">Sobre esta aula</h4>
                <p className="text-sm text-gray-400 leading-relaxed max-w-3xl">
                  Nesta aula, você aprenderá os conceitos fundamentais e as melhores práticas da agência sobre <strong>{activeVideo.title.replace('Trilha: ', '')}</strong>. 
                  Sugerimos que faça anotações no seu app favorito e complete os exercícios propostos no final do módulo. Dúvidas podem ser tiradas na comunidade ou diretamente com seu gestor.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Academy;
