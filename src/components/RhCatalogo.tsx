import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Search, Briefcase, DollarSign, Wallet, Phone, Mail, Plus, X, UserCog, Trash2 } from 'lucide-react';
import { useToast } from './Toast';
import { useRh } from '../hooks/useRh';
import { Modal } from './ui/Modal';
import useEscapeKey from '../hooks/useEscapeKey';
import { RhProfile } from '../services/rhService';

const RhFormModal = ({ onClose, onAdd }: { onClose: () => void, onAdd: (p: Omit<RhProfile, 'id'>) => void }) => {
  useEscapeKey(onClose);
  const [form, setForm] = useState({
    name: '', role: '', type: 'Freelancer' as RhProfile['type'], costPerHour: 0, costPerDay: 0,
    phone: '', email: '', pix: '', skills: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      name: form.name,
      role: form.role,
      type: form.type,
      costPerHour: Number(form.costPerHour),
      costPerDay: Number(form.costPerDay),
      phone: form.phone,
      email: form.email,
      pix: form.pix,
      skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(form.name)}&background=random`
    });
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Adicionar Colaborador" maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Nome Completo</label>
          <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-blue-500 outline-none" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Cargo principal</label>
            <input required type="text" value={form.role} onChange={e => setForm({...form, role: e.target.value})} placeholder="Ex: Videomaker" className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Tipo de Contrato</label>
            <select value={form.type} onChange={e => setForm({...form, type: e.target.value as any})} className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-blue-500 outline-none">
              <option value="Freelancer">Freelancer</option>
              <option value="PJ">PJ</option>
              <option value="CLT">CLT</option>
              <option value="Sócio">Sócio</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Custo / Hora</label>
            <input type="number" min="0" value={form.costPerHour} onChange={e => setForm({...form, costPerHour: Number(e.target.value)})} className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Diária (8h)</label>
            <input type="number" min="0" value={form.costPerDay} onChange={e => setForm({...form, costPerDay: Number(e.target.value)})} className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-blue-500 outline-none" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Telefone / WhatsApp</label>
            <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Email</label>
            <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-blue-500 outline-none" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Chave PIX</label>
          <input type="text" value={form.pix} onChange={e => setForm({...form, pix: e.target.value})} className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-blue-500 outline-none" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Habilidades (separadas por vírgula)</label>
          <input type="text" value={form.skills} onChange={e => setForm({...form, skills: e.target.value})} placeholder="Ex: Premiere, Fotografia, Copy" className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-blue-500 outline-none" />
        </div>
        <div className="flex justify-end gap-2 pt-4 border-t border-white/5">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">Cancelar</button>
          <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-xl text-sm font-medium transition-colors">Salvar Perfil</button>
        </div>
      </form>
    </Modal>
  );
}

const RhCatalogo = () => {
  const { team, isLoading, addProfile, removeProfile } = useRh();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('TODOS');
  const [showAddModal, setShowAddModal] = useState(false);
  const { showToast, ToastContainer } = useToast();

  const filteredTeam = team.filter(m => {
    const passType = filterType === 'TODOS' || m.type === filterType;
    const passSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.role.toLowerCase().includes(searchQuery.toLowerCase());
    return passType && passSearch;
  });

  if (isLoading) return <div className="p-8 text-white">Carregando catálogo de RH...</div>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="p-6 lg:p-8 h-full flex flex-col text-white overflow-y-auto custom-scrollbar"
      style={{ background: 'var(--surface-0)' }}
    >
      <div className="max-w-[1400px] mx-auto w-full flex flex-col">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight mb-1">Equipe & RH</h1>
            <p className="text-zinc-500 text-[13px]">Catálogo de colaboradores, freelancers e tabelas de custos.</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar por nome ou cargo..."
                className="w-full bg-[#141414] border border-white/5 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="bg-[#141414] border border-white/5 text-gray-300 text-sm rounded-xl px-4 py-2 outline-none focus:border-blue-500 transition-colors"
            >
              <option value="TODOS">Todos</option>
              <option value="Sócio">Sócios</option>
              <option value="CLT">CLT</option>
              <option value="PJ">PJ</option>
              <option value="Freelancer">Freelancers</option>
            </select>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-[13px] font-medium flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" /> Adicionar
            </button>
          </div>
        </div>

        {/* Dashboard KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
           <div className="bg-[#111] border border-[#222] rounded-2xl p-5 flex items-center justify-between group hover:border-[#333] transition-colors">
              <div>
                 <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">Total de Colaboradores</p>
                 <div className="text-2xl font-bold">{team.length}</div>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                 <Users className="w-6 h-6" />
              </div>
           </div>
           <div className="bg-[#111] border border-[#222] rounded-2xl p-5 flex items-center justify-between group hover:border-[#333] transition-colors">
              <div>
                 <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">Custo Médio / Diária (Free)</p>
                 <div className="text-2xl font-bold">R$ {Math.round(team.filter(t => t.type === 'Freelancer').reduce((a,b) => a + b.costPerDay, 0) / (team.filter(t => t.type === 'Freelancer').length || 1))}</div>
              </div>
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                 <DollarSign className="w-6 h-6" />
              </div>
           </div>
           <div className="bg-[#111] border border-[#222] rounded-2xl p-5 flex items-center justify-between group hover:border-[#333] transition-colors">
              <div>
                 <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">Base Ativa</p>
                 <div className="text-2xl font-bold">{team.filter(t => t.type !== 'Sócio').length} Prestadores</div>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
                 <Briefcase className="w-6 h-6" />
              </div>
           </div>
        </div>

        {/* Grid de Colaboradores */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredTeam.map(member => (
              <motion.div
                key={member.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#111] border border-[#222] rounded-2xl p-6 flex flex-col group hover:border-[#444] transition-all hover:shadow-2xl hover:shadow-black/50 relative"
              >
                <button
                  onClick={() => {
                    if (window.confirm(`Deseja remover ${member.name}?`)) {
                      removeProfile(member.id);
                      showToast('Perfil removido.');
                    }
                  }}
                  className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-red-500/20 text-gray-500 hover:text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all border border-transparent hover:border-red-500/30"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="flex items-start justify-between mb-4 pr-10">
                  <div className="flex items-center gap-4">
                    <img src={member.avatar} alt={member.name} className="w-12 h-12 rounded-full object-cover border-2 border-[#333]" />
                    <div>
                      <h3 className="font-bold text-white text-lg">{member.name}</h3>
                      <p className="text-sm text-gray-400">{member.role}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${
                    member.type === 'Freelancer' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                    member.type === 'PJ' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                    member.type === 'CLT' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    'bg-orange-500/10 text-orange-400 border-orange-500/20'
                  }`}>
                    {member.type}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-[#1a1a1a] rounded-xl border border-white/5">
                  <div>
                     <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-0.5">Custo Hora</p>
                     <p className="font-medium text-gray-200">R$ {member.costPerHour}</p>
                  </div>
                  <div>
                     <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-0.5">Diária (8h)</p>
                     <p className="font-medium text-gray-200">R$ {member.costPerDay}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 mt-auto">
                   <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Phone className="w-4 h-4" /> <span className="truncate">{member.phone || 'Não informado'}</span>
                   </div>
                   <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Mail className="w-4 h-4" /> <span className="truncate">{member.email || 'Não informado'}</span>
                   </div>
                   <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Wallet className="w-4 h-4" /> <span className="truncate font-mono text-xs mt-0.5">{member.pix || 'Sem chave PIX'}</span>
                   </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-white/5 flex gap-1.5 overflow-x-auto custom-scrollbar pb-1">
                   {member.skills && member.skills.map((s, idx) => (
                      <span key={idx} className="bg-white/5 border border-white/10 text-[10px] font-medium text-gray-300 px-2 py-1 rounded whitespace-nowrap">
                         {s}
                      </span>
                   ))}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        {filteredTeam.length === 0 && (
          <div className="flex flex-col items-center justify-center p-12 text-gray-500">
             <UserCog className="w-12 h-12 mb-4 opacity-40" />
             <p>Nenhum colaborador encontrado.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showAddModal && <RhFormModal onClose={() => setShowAddModal(false)} onAdd={(p) => { addProfile(p); setShowAddModal(false); showToast('Perfil adicionado com sucesso!'); }} />}
      </AnimatePresence>
      <ToastContainer />
    </motion.div>
  );
};

export default RhCatalogo;
