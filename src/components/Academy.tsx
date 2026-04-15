import React, { useState, useCallback } from 'react';
import { Play, Clock, ChevronRight, BookOpen, X, CheckCircle2, ArrowLeft, FileText, Video as VideoIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import useEscapeKey from '../hooks/useEscapeKey';
import { useAppContext } from '../context/AppContext';
import { academyTracks } from '../data';
import { CourseTrack, Lesson } from '../types';

const Academy = () => {
  const [activeTrack, setActiveTrack] = useState<CourseTrack | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const { watchedVideos, toggleVideoWatched } = useAppContext();

  // For Escape key closing
  const closeView = useCallback(() => {
    setActiveTrack(null);
    setActiveLesson(null);
  }, []);
  useEscapeKey(closeView, !!activeTrack);

  const openTrack = (track: CourseTrack) => {
    setActiveTrack(track);
    if (track.lessons && track.lessons.length > 0) {
      setActiveLesson(track.lessons[0]);
    } else {
      setActiveLesson(null);
    }
  };

  const isTrackWatched = (trackId: number) => watchedVideos.includes(`trilha-${trackId}`);
  const isLessonWatched = (lessonId: string) => watchedVideos.includes(lessonId);

  // Home View (Grid of Tracks)
  if (!activeTrack) {
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
              <button onClick={() => toggleVideoWatched(heroId)} className="bg-white text-black px-6 py-3 rounded-lg font-bold flex items-center gap-2 w-fit hover:bg-gray-200 hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)]">
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
               const isWatched = isTrackWatched(trilha.id);
               
               return (
                 <motion.div 
                   key={trilha.id} 
                   whileHover={{ y: -5 }}
                   className="group cursor-pointer bg-[#141414] border border-[#222] rounded-2xl overflow-hidden hover:border-red-500/30 transition-all shadow-lg"
                   onClick={() => openTrack(trilha)}
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
      </motion.div>
    );
  }

  // Split View (Track Details)
  return (
    <div className="flex h-full w-full bg-[#0a0a0a] text-white">
      {/* Left Content Area (Player / Text) */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto custom-scrollbar relative">
        <div className="absolute top-4 left-4 z-50">
          <button 
            onClick={closeView}
            className="flex items-center gap-2 px-3 py-2 bg-black/50 backdrop-blur-md rounded-lg text-sm text-gray-300 hover:text-white border border-white/10 hover:border-white/30 transition-all font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar às Trilhas
          </button>
        </div>

        {activeLesson ? (
          <>
            {/* Media Area */}
            {activeLesson.type !== 'text' && (
              <div className="w-full aspect-video bg-black flex items-center justify-center relative sticky top-0 z-40 border-b border-[#222]">
                <div className="absolute inset-0 flex flex-col items-center justify-center animate-pulse">
                  <Play className="w-16 h-16 text-red-500/50 mb-4" />
                  <span className="text-gray-500 font-medium">Player Placeholder para "{activeLesson.title}"</span>
                </div>
              </div>
            )}

            {/* Content Area */}
            <div className="max-w-4xl w-full mx-auto p-8 lg:p-12">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold leading-tight mb-2">{activeLesson.title}</h2>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>Módulo: {activeTrack.title}</span>
                    {activeLesson.duration && (
                      <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {activeLesson.duration}</span>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => toggleVideoWatched(activeLesson.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
                    isLessonWatched(activeLesson.id) 
                      ? 'bg-green-500/10 text-green-500 border border-green-500/30' 
                      : 'bg-primary hover:bg-primary/80 border border-primary text-white'
                  }`}
                >
                  <CheckCircle2 className="w-5 h-5" /> 
                  {isLessonWatched(activeLesson.id) ? 'Concluída' : 'Marcar como Concluída'}
                </button>
              </div>

              {activeLesson.content && (
                <div className="prose prose-invert max-w-none prose-p:text-gray-300 prose-headings:text-white">
                  {/* Mock rendering of markdown content */}
                  {activeLesson.content.split('\n').map((line, i) => {
                    if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-bold mt-6 mb-4">{line.substring(2)}</h1>;
                    return <p key={i} className="mb-4 text-gray-300 leading-relaxed">{line}</p>;
                  })}
                </div>
              )}
              
              {!activeLesson.content && activeLesson.type === 'video' && (
                <div className="text-gray-400 leading-relaxed mt-6">
                  Nenhum material de apoio adicionado nesta aula. Preste atenção no vídeo e faça suas anotações!
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 flex-col gap-4">
            <BookOpen className="w-16 h-16 opacity-30" />
            <p>Selecione uma aula na lateral para começar.</p>
          </div>
        )}
      </div>

      {/* Right Sidebar (Lesson List) */}
      <div className="w-[350px] shrink-0 bg-[#141414] border-l border-[#222] flex flex-col h-full z-50">
        <div className="p-6 border-b border-[#222]">
          <h3 className="text-lg font-bold mb-1 line-clamp-1 text-white">{activeTrack.title}</h3>
          <div className="w-full h-1.5 bg-[#222] rounded-full overflow-hidden mt-3">
             <div 
               className="h-full bg-green-500 transition-all duration-500" 
               style={{ width: `${activeTrack.lessons ? (activeTrack.lessons.filter(l => isLessonWatched(l.id)).length / activeTrack.lessons.length) * 100 : 0}%` }} 
             />
          </div>
          <div className="flex justify-between text-[11px] font-bold text-gray-500 tracking-wider uppercase mt-2">
            <span>Progresso</span>
            <span>
              {activeTrack.lessons ? activeTrack.lessons.filter(l => isLessonWatched(l.id)).length : 0} de {activeTrack.lessons?.length || 0}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
          {(!activeTrack.lessons || activeTrack.lessons.length === 0) ? (
            <div className="p-4 text-center text-gray-500 text-sm">Nenhuma aula cadastrada.</div>
          ) : (
            activeTrack.lessons.map((lesson, idx) => {
              const watched = isLessonWatched(lesson.id);
              const isActive = activeLesson?.id === lesson.id;
              
              return (
                <button
                  key={lesson.id}
                  onClick={() => setActiveLesson(lesson)}
                  className={`w-full text-left p-3 rounded-lg flex items-start gap-3 transition-colors ${
                    isActive ? 'bg-white/10' : 'hover:bg-white/5'
                  }`}
                >
                  <div className={`mt-0.5 shrink-0 w-5 h-5 rounded-full flex items-center justify-center border ${
                    watched ? 'bg-green-500/20 border-green-500 text-green-500' : 'border-[#444] text-gray-500'
                  }`}>
                    {watched ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span className="text-[10px] font-medium">{idx + 1}</span>}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-sm font-medium line-clamp-2 leading-snug ${isActive ? 'text-white' : 'text-gray-300'}`}>
                      {lesson.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500">
                      {lesson.type === 'video' || lesson.type === 'both' ? (
                        <span className="flex items-center gap-1"><VideoIcon className="w-3.5 h-3.5" /> {lesson.duration}</span>
                      ) : (
                        <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> Leitura</span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Academy;
