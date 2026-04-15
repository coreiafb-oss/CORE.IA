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

// ─── Task Comment ──────────────────────────────────────────────────────────────
export type TaskComment = {
  id: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  createdAt: string; // ISO
};

// ─── Task Attachment ───────────────────────────────────────────────────────────
export type TaskAttachment = {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'video' | 'pdf' | 'file';
  size?: number;
  uploadedAt: string;
};

// ─── Automation ────────────────────────────────────────────────────────────────
export type AutomationAction =
  | { type: 'remove_assignee'; assigneeId: string }
  | { type: 'add_assignee'; assigneeId: string; displayName: string; avatar: string }
  | { type: 'set_priority'; priority: Priority }
  | { type: 'set_status'; statusId: string };

export type Automation = {
  id: string;
  name: string;
  trigger: {
    type: 'status_change';
    fromStatusId: string; // '*' = qualquer status
    toStatusId: string;
  };
  actions: AutomationAction[];
  isActive: boolean;
};

// ─── Task ──────────────────────────────────────────────────────────────────────
export type Task = {
  id: string;
  name: string;
  description?: string;
  statusId: string;
  assignees: string[]; // avatar URLs
  dueDate?: string;
  priority: Priority;
  tags?: Tag[];
  comments?: TaskComment[];
  attachments?: TaskAttachment[];
  relatedTaskIds?: string[];
  createdAt?: string;
  completedAt?: string;
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

export type ViewType = 'overview' | 'tasks' | 'clients' | 'board' | 'calendar' | 'client-board' | 'client-database' | 'task-dashboard';

// ─── CRM Types ────────────────────────────────────────────────────────────────
export type Column = {
  id: string;
  title: string;
  color: string;
};

export type LeadActivity = {
  id: string;
  type: 'note' | 'status_change' | 'email' | 'call' | 'comment' | 'task_created' | 'task_completed' | 'created';
  content: string;
  date: string; // ISO
  authorName?: string;
};

export type LeadTask = {
  id: string;
  leadId: string;
  title: string;
  dueDate?: string;
  dueTime?: string;
  done: boolean;
  createdAt: string;
};

export type Lead = {
  id: string;
  columnId: string;
  title: string;
  value: number;
  date: string;

  // Contato
  contactName?: string;
  email?: string;
  phone?: string;
  source?: string;
  tags?: string[];
  notes?: string;
  activities?: LeadActivity[];

  // Empresa (NOVO)
  companyName?: string;
  companyEmail?: string;
  companyPhone?: string;
  companyCNPJ?: string;
  companyAddress?: string;

  // Tarefas vinculadas
  tasks?: LeadTask[];
};

// ─── CRM Column (editável) ────────────────────────────────────────────────────
export type CrmColumn = {
  id: string;
  title: string;
  color: string; // Tailwind bg class ou hex
  accent: string;
};

// ─── Financeiro Types ─────────────────────────────────────────────────────────
export type TransactionType = 'income' | 'expense';

export type Transaction = {
  id: number;
  title: string;
  category: string;
  subcategory?: string;
  date: string;
  amount: number;
  type: TransactionType;
  notes?: string;
  externalId?: string;
  importSource?: string;
};

export type DRECategory = {
  id: string;
  name: string;
  type: 'revenue' | 'expense';
  subcategories: string[];
};

// ─── Aprovação Types ──────────────────────────────────────────────────────────
export type ContentStatus = 'PENDENTE' | 'REVISÃO' | 'ALTERAÇÃO' | 'APROVADO';
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
  fileUrl?: string;
  linkedTaskId?: string; // integração com tarefas
  caption?: string;      // legenda do post
  postDate?: string;     // data de postagem
};

export type ContentGroup = {
  id: string;
  title: string;
  clientName: string;
  shareToken: string;
  taskIds: string[];
  items: ContentItem[];
  createdAt: string;
  status: 'draft' | 'sent' | 'approved' | 'revision';
};

// ─── Agendamento Types ────────────────────────────────────────────────────────
export type EventType = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  isDefault: boolean;
};

export type ScheduledEvent = {
  id: string;
  title: string;
  eventTypeId: string;
  clientName?: string;
  assignees: string[];
  date: string;
  time: string;
  endTime?: string;
  meetLink?: string;
  description?: string;
  reminder?: '5min' | '10min' | '30min' | '1h' | '1d';
  recurrence?: 'none' | 'daily' | 'weekly' | 'custom';
  createdAt: string;
};

// Retrocompatibilidade com Meeting (antigo)
export type Meeting = {
  id: number;
  title: string;
  date: string;
  time: string;
  client: string;
  platform: string;
  isToday: boolean;
};

// ─── ACADEMY Types ────────────────────────────────────────────────────────────
export type Lesson = {
  id: string;
  title: string;
  duration?: string;
  type: 'video' | 'text' | 'both';
  videoUrl?: string;
  content?: string; // markdown/texto
  completed?: boolean;
};

// retrocompat
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
  lessons?: Lesson[];
};
