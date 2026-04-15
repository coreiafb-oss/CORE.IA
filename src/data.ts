import { 
  Status, Task, ClientStatus, Client, 
  Column, Lead, Transaction, ContentItem, Meeting, CourseTrack 
} from './types';

// ─── GESTOR / CLICKUP DATA ────────────────────────────────────────────────────
export const statuses: Status[] = [
  { id: 's1', name: 'PENDENTE', color: '#e8384f' },
  { id: 's2', name: 'REVISÃO INTERNA FINAL', color: '#f2c744' },
  { id: 's3', name: 'EM APROVAÇÃO COM CLIENTE', color: '#fd7120' },
  { id: 's4', name: 'PRONTO PARA POSTAR', color: '#20c997' },
];

export const tasks: Task[] = [
  {
    id: 't1',
    name: '[KiDelícia] Roteiro gravação Abril - Rede social | Mar/26',
    statusId: 's2',
    assignees: ['https://i.pravatar.cc/150?u=1'],
    dueDate: '4 dias atrás',
    priority: 'High',
  },
  {
    id: 't2',
    name: '[KiDelícia] Campanha de Branding | Fev/25',
    statusId: 's3',
    assignees: ['https://i.pravatar.cc/150?u=2'],
    dueDate: '',
    priority: 'Low',
    tags: [{ name: 'standby', color: '#ff7070', bgColor: 'rgba(255, 112, 112, 0.15)' }],
  },
  {
    id: 't3',
    name: '[KiDelícia] triângulo amoroso - Estático | Mar/26',
    statusId: 's3',
    assignees: ['https://i.pravatar.cc/150?u=3'],
    dueDate: '',
    priority: 'High',
    tags: [{ name: 'alteração', color: '#20c997', bgColor: 'rgba(32, 201, 151, 0.15)' }],
  },
  {
    id: 't4',
    name: '[KiDelícia] Aviso semana santa - Estático | Mar/26',
    statusId: 's3',
    assignees: ['https://i.pravatar.cc/150?u=4'],
    dueDate: '',
    priority: 'Normal',
  },
  {
    id: 't5',
    name: '[KiDelícia] pãozinho com uma coca - Carrossel | Mar/26',
    statusId: 's4',
    assignees: ['https://i.pravatar.cc/150?u=5'],
    dueDate: '',
    priority: 'None',
  },
  {
    id: 't11',
    name: '[KiDelícia] O caminho da felicidade - Estático | Mar/26',
    statusId: 's4',
    assignees: ['https://i.pravatar.cc/150?u=11'],
    dueDate: '',
    priority: 'None',
  },
];

export const clientStatuses: ClientStatus[] = [
  { id: 'cs1', name: 'CHURNED/LOST', color: '#6b7280' },
  { id: 'cs2', name: 'ACTIVE CLIENT', color: '#b328f6' },
  { id: 'cs3', name: 'ONBOARDING', color: '#20c997' },
  { id: 'cs4', name: 'NEGOTIATING', color: '#f2c744' },
  { id: 'cs5', name: 'CONTACTED', color: '#00a2ff' },
  { id: 'cs6', name: 'NEW CLIENT', color: '#e8384f' },
];

export const clients: Client[] = [
  {
    id: 'c1',
    name: 'TechCorp Solutions',
    statusId: 'cs2',
    assignees: ['https://i.pravatar.cc/150?u=12'],
    faturamento: 'R$ 15.000,00',
    segmento: 'Tecnologia',
    repositorio: 'Google Drive',
    ultimaReuniao: '31/10/2023'
  },
  {
    id: 'c4',
    name: 'Pão de Queijo KiDelícia',
    statusId: 'cs2',
    assignees: ['https://i.pravatar.cc/150?u=15'],
    faturamento: 'R$ 12.000,00',
    segmento: 'Alimentação',
    repositorio: 'Google Drive',
    ultimaReuniao: '15/11/2023'
  }
];

// ─── CRM DATA ────────────────────────────────────────────────────────────────
export const crmColumns: Column[] = [
  { id: 'leads', title: 'Leads', color: 'bg-blue-500' },
  { id: 'agendada', title: 'Reunião Agendada', color: 'bg-purple-500' },
  { id: 'proposta', title: 'Proposta Enviada', color: 'bg-orange-500' },
  { id: 'ganho', title: 'Fechado (Ganho)', color: 'bg-green-500' },
  { id: 'perdido', title: 'Perdido', color: 'bg-red-500' },
];

export const crmLeads: Lead[] = [
  { 
    id: 'l1', columnId: 'agendada', title: 'TechCorp Solutions', value: 15000, date: '2023-10-31',
    contactName: 'Carlos Silva', email: 'carlos@techcorp.com', phone: '(11) 99999-1111',
    source: 'Inbound', tags: ['Enterprise', 'Tech'],
    notes: 'Cliente demonstrou muito interesse na solução de automação.',
    activities: [
      { id: 'a1', type: 'note', content: 'Primeira call feita', date: '2023-10-25' },
      { id: 'a2', type: 'status_change', content: 'Movido para Reunião Agendada', date: '2023-10-28' }
    ]
  },
  { 
    id: 'l2', columnId: 'agendada', title: 'EducaMais EAD', value: 8500, date: '2023-11-04',
    contactName: 'Amanda Oliveira', email: 'amanda@educamais.com',
    source: 'Indicação', tags: ['Educação']
  },
  { id: 'l3', columnId: 'agendada', title: 'Clinica Sorriso', value: 5000, date: '2023-11-09' },
  { id: 'l4', columnId: 'leads', title: 'Nova Startup XYZ', value: 12000, date: '2023-11-15' },
  { id: 'l5', columnId: 'proposta', title: 'Indústria ABC', value: 35000, date: '2023-11-12', tags: ['VIP'] },
];

// ─── FINANCEIRO DATA ──────────────────────────────────────────────────────────
export const transactions: Transaction[] = [
  { id: 1, title: 'Fee Mensal - Loja XYZ', category: 'Fee Mensal', date: '31/10/2023', amount: 5000, type: 'income' },
  { id: 2, title: 'Meta Ads', category: 'Tráfego', date: '04/11/2023', amount: -2000, type: 'expense' },
  { id: 3, title: 'Software (Figma, Adobe)', category: 'Ferramentas', date: '09/11/2023', amount: -450, type: 'expense' },
  { id: 4, title: 'Fee Mensal - TechCorp', category: 'Fee Mensal', date: '10/11/2023', amount: 15000, type: 'income' },
];

// ─── APROVAÇÃO DATA ───────────────────────────────────────────────────────────
export const initialContent: ContentItem[] = [
  {
    id: 1,
    title: 'Campanha Black Friday - Vídeo Principal',
    type: 'video',
    status: 'PENDENTE',
    date: '10/11/2023',
    feedback: null,
    thumbnail: 'N',
    color: 'from-red-900 to-black',
    textColor: 'text-red-600'
  },
  {
    id: 2,
    title: 'Carrossel Instagram - Lançamento Produto X',
    type: 'image',
    status: 'REVISÃO',
    date: '09/11/2023',
    feedback: 'Aumentar o logo na segunda imagem.',
    thumbnail: 'img',
    color: 'from-pink-600 to-orange-500',
    textColor: 'text-white'
  },
  {
    id: 3,
    title: 'Apresentação Comercial Q4',
    type: 'pdf',
    status: 'APROVADO',
    date: '05/11/2023',
    feedback: null,
    thumbnail: 'pdf',
    color: 'bg-gray-200',
    textColor: 'text-gray-800'
  }
];

// ─── AGENDAMENTO DATA ──────────────────────────────────────────────────────────
export const initialMeetings: Meeting[] = [
  { id: 1, title: 'Apresentação de Resultados - Q3', date: 'Hoje', time: '14:00 - 15:00', client: 'TechCorp', platform: 'Google Meet', isToday: true },
  { id: 2, title: 'Reunião de Alinhamento Semanal', date: 'Amanhã', time: '10:00 - 11:00', client: 'Equipe Interna', platform: 'Zoom', isToday: false },
  { id: 3, title: 'Kickoff Novo Projeto', date: '15/11', time: '16:30 - 17:30', client: 'EducaMais', platform: 'Google Meet', isToday: false },
];

// ─── ACADEMY DATA ──────────────────────────────────────────────────────────────
export const academyTracks: CourseTrack[] = [
  { 
    id: 1, 
    img: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?q=80&w=2070&auto=format&fit=crop', 
    title: 'Onboarding', 
    duration: '2h 30m', 
    videos: 5,
    lessons: [
      { id: 'l1-1', title: 'Boas vindas à Agência', duration: '15m', type: 'video' },
      { id: 'l1-2', title: 'Nossa cultura e valores', duration: '45m', type: 'video' },
      { id: 'l1-3', title: 'Ferramentas de trabalho', type: 'text', content: '# Nossas Ferramentas\nUtilizamos o Slack, o WhatsApp e nosso próprio LINE OS.' },
      { id: 'l1-4', title: 'Processos de aprovação', duration: '30m', type: 'both', content: 'Sempre exija aprovação formal do cliente.' },
      { id: 'l1-5', title: 'Seu primeiro projeto', duration: '60m', type: 'video' },
    ]
  },
  { 
    id: 2, 
    img: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2015&auto=format&fit=crop', 
    title: 'Gestão de Comercial', 
    duration: '5h 15m', 
    videos: 12,
    lessons: [
      { id: 'l2-1', title: 'Como prospectar', duration: '1h', type: 'video' },
      { id: 'l2-2', title: 'Fechamento matador', duration: '2h', type: 'video' }
    ]
  },
  { id: 3, img: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1974&auto=format&fit=crop', title: 'Design & Criativos', duration: '3h 45m', videos: 8 },
  { id: 4, img: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?q=80&w=2070&auto=format&fit=crop', title: 'Atendimento Pró', duration: '1h 20m', videos: 3 },
];
