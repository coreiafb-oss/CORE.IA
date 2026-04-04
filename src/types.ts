export type Status = {
  id: string;
  name: string;
  color: string;
};

export type Priority = 'Urgent' | 'High' | 'Normal' | 'Low' | 'None';

export type Tag = {
  name: string;
  color: string;
  bgColor: string;
};

export type Task = {
  id: string;
  name: string;
  statusId: string;
  assignees: string[];
  dueDate?: string;
  priority: Priority;
  tags?: Tag[];
};

export type ClientStatus = {
  id: string;
  name: string;
  color: string;
};

export type Client = {
  id: string;
  name: string;
  statusId: string;
  assignees: string[];
  faturamento?: string;
  segmento?: string;
  repositorio?: string;
  ultimaReuniao?: string;
};

export type ViewType = 'overview' | 'tasks' | 'clients' | 'board' | 'calendar' | 'client-board' | 'client-database';

// ─── CRM Types ───────────────────────────────────────────────────────────────
export type Column = {
  id: string;
  title: string;
  color: string;
};

export type LeadActivity = {
  id: string;
  type: 'note' | 'status_change' | 'email' | 'call';
  content: string;
  date: string; // ISO
};

export type Lead = {
  id: string;
  columnId: string;
  title: string;
  value: number;
  date: string;
  
  // Advanced Fields
  contactName?: string;
  email?: string;
  phone?: string;
  source?: string;
  tags?: string[];
  notes?: string;
  activities?: LeadActivity[];
};

// ─── Financeiro Types ──────────────────────────────────────────────────────────
export type TransactionType = 'income' | 'expense';

export type Transaction = {
  id: number;
  title: string;
  category: string;
  date: string;
  amount: number;
  type: TransactionType;
};

// ─── Aprovação Types ───────────────────────────────────────────────────────────
export type ContentStatus = 'PENDENTE' | 'REVISÃO' | 'APROVADO';
export type ContentType = 'video' | 'image' | 'pdf' | 'audio';

export type ContentItem = {
  id: number;
  title: string;
  type: ContentType;
  status: ContentStatus;
  date: string;
  feedback: string | null;
  thumbnail: string;
  color: string;
  textColor: string;
  fileUrl?: string; // Para preview nos arquivos carregados localmente
};

// ─── Agendamento Types ─────────────────────────────────────────────────────────
export type Meeting = {
  id: number;
  title: string;
  date: string;
  time: string;
  client: string;
  platform: string;
  isToday: boolean;
};

// ─── ACADEMY Types ─────────────────────────────────────────────────────────────
export type VideoLesson = {
  id: string;
  title: string;
  duration: string;
};

export type CourseTrack = {
  id: number;
  img: string;
  title: string;
  duration: string;
  videos: number;
  lessons?: VideoLesson[];
};
