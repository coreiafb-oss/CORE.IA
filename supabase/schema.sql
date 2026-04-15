-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║                        LINE OS — SUPABASE SCHEMA                          ║
-- ║           Production-Grade SQL — Cole no SQL Editor do Supabase            ║
-- ║                                                                           ║
-- ║  Cobre TODOS os módulos:                                                  ║
-- ║  • Gestor (Tasks & Statuses)                                              ║
-- ║  • CRM & Vendas (Pipeline Leads)                                          ║
-- ║  • Financeiro & DRE (Transações)                                          ║
-- ║  • Aprovação de Conteúdo (Media Items)                                    ║
-- ║  • Agendamento (Reuniões)                                                 ║
-- ║  • Academy (Trilhas & Progresso)                                          ║
-- ║  • Clientes                                                               ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

-- ═══════════════════════════════════════════════════════════════════════════════
-- 0. EXTENSIONS
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. ENUMS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Roles do sistema
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('ADMIN', 'EQUIPE', 'CLIENTE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Prioridade de tarefas (mapeia types.ts → Priority)
DO $$ BEGIN
  CREATE TYPE task_priority AS ENUM ('Urgent', 'High', 'Normal', 'Low', 'None');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Tipo de transação financeira (mapeia types.ts → TransactionType)
DO $$ BEGIN
  CREATE TYPE transaction_type AS ENUM ('income', 'expense');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Status de aprovação de conteúdo (mapeia types.ts → ContentStatus)
DO $$ BEGIN
  CREATE TYPE content_status AS ENUM ('PENDENTE', 'REVISÃO', 'ALTERAÇÃO', 'APROVADO');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Tipo de mídia (mapeia types.ts → ContentType)
DO $$ BEGIN
  CREATE TYPE content_type AS ENUM ('video', 'image', 'pdf');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. TABELAS
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── 2.1 PROFILES (extensão do auth.users) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email         TEXT NOT NULL,
  full_name     TEXT,
  avatar_url    TEXT,
  role          user_role DEFAULT 'EQUIPE'::user_role NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.profiles IS 'Perfis de usuário estendendo auth.users';


-- ─── 2.2 TASK STATUSES (mapeia types.ts → Status) ────────────────────────────
CREATE TABLE IF NOT EXISTS public.task_statuses (
  id            TEXT PRIMARY KEY,              -- 's1', 's2', 's3', 's4'
  name          TEXT NOT NULL,                 -- 'PENDENTE', 'REVISÃO INTERNA FINAL', etc.
  color         TEXT NOT NULL DEFAULT '#6b7280', -- Hex color
  sort_order    INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.task_statuses IS 'Status possíveis para tarefas do Gestor';


-- ─── 2.3 TASKS (mapeia types.ts → Task) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tasks (
  id            TEXT PRIMARY KEY DEFAULT 't-' || gen_random_uuid()::TEXT,
  name          TEXT NOT NULL,
  description   TEXT,
  status_id     TEXT NOT NULL REFERENCES public.task_statuses(id) ON DELETE SET DEFAULT,
  assignees     TEXT[] DEFAULT '{}',           -- Array de URLs de avatar
  due_date      TEXT,                          -- String livre ('4 dias atrás', '2024-04-01')
  priority      task_priority DEFAULT 'None'::task_priority NOT NULL,
  tags          JSONB DEFAULT '[]'::JSONB,     -- [{ name, color, bgColor }]
  related_task_ids TEXT[] DEFAULT '{}',
  sort_order    INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.tasks IS 'Tarefas do módulo Gestor (ClickUp-like)';

CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status_id);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON public.tasks(priority);


-- ─── 2.4 CLIENT STATUSES (mapeia types.ts → ClientStatus) ────────────────────
CREATE TABLE IF NOT EXISTS public.client_statuses (
  id            TEXT PRIMARY KEY,              -- 'cs1', 'cs2', ...
  name          TEXT NOT NULL,
  color         TEXT NOT NULL DEFAULT '#6b7280',
  sort_order    INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.client_statuses IS 'Status possíveis para clientes';


-- ─── 2.5 CLIENTS (mapeia types.ts → Client) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.clients (
  id            TEXT PRIMARY KEY DEFAULT 'c-' || gen_random_uuid()::TEXT,
  name          TEXT NOT NULL,
  status_id     TEXT NOT NULL REFERENCES public.client_statuses(id) ON DELETE SET DEFAULT,
  assignees     TEXT[] DEFAULT '{}',
  faturamento   TEXT,                          -- 'R$ 15.000,00'
  segmento      TEXT,
  repositorio   TEXT,
  ultima_reuniao TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.clients IS 'Clientes da agência';

CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(status_id);


-- ─── 2.6 CRM COLUMNS (mapeia types.ts → Column) ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.crm_columns (
  id            TEXT PRIMARY KEY,              -- 'leads', 'agendada', 'proposta', 'ganho', 'perdido'
  title         TEXT NOT NULL,
  color         TEXT NOT NULL,                 -- CSS class: 'bg-blue-500'
  sort_order    INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.crm_columns IS 'Colunas do pipeline CRM';


-- ─── 2.7 CRM LEADS (mapeia types.ts → Lead) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.crm_leads (
  id            TEXT PRIMARY KEY DEFAULT 'lead-' || gen_random_uuid()::TEXT,
  column_id     TEXT NOT NULL REFERENCES public.crm_columns(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  value         NUMERIC(12,2) NOT NULL DEFAULT 0,
  date          TEXT NOT NULL,                 -- ISO date string
  contact_name  TEXT,
  email         TEXT,
  phone         TEXT,
  company_name  TEXT,
  company_email TEXT,
  company_phone TEXT,
  company_cnpj  TEXT,
  company_address TEXT,
  sort_order    INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.crm_leads IS 'Leads do pipeline CRM & Vendas';

CREATE INDEX IF NOT EXISTS idx_leads_column ON public.crm_leads(column_id);


-- ─── 2.8 TRANSACTIONS / FINANCEIRO (mapeia types.ts → Transaction) ───────────
CREATE TABLE IF NOT EXISTS public.transactions (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title         TEXT NOT NULL,
  category      TEXT NOT NULL DEFAULT 'Outros',
  date          TEXT NOT NULL,                 -- ISO date: '2024-11-15'
  amount        NUMERIC(12,2) NOT NULL,        -- Positivo = receita, Negativo = despesa
  type          transaction_type NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.transactions IS 'Transações financeiras (Receitas & Despesas)';

CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date);


-- ─── 2.9 CONTENT ITEMS / APROVAÇÃO (mapeia types.ts → ContentItem) ───────────
CREATE TABLE IF NOT EXISTS public.content_items (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title         TEXT NOT NULL,
  type          content_type NOT NULL DEFAULT 'video'::content_type,
  status        content_status NOT NULL DEFAULT 'PENDENTE'::content_status,
  date          TEXT NOT NULL,                 -- ISO date
  feedback      TEXT,                          -- NULL se sem feedback
  thumbnail     TEXT DEFAULT 'N',              -- 'N', 'img', 'pdf'
  color         TEXT DEFAULT 'from-red-900 to-black', -- CSS gradient classes
  text_color    TEXT DEFAULT 'text-red-600',
  linked_task_id TEXT REFERENCES public.tasks(id) ON DELETE SET NULL,
  sort_order    INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.content_items IS 'Itens para aprovação de conteúdo (mídias)';

CREATE INDEX IF NOT EXISTS idx_content_status ON public.content_items(status);


-- ─── 2.10 MEETINGS / AGENDAMENTO (mapeia types.ts → Meeting) ─────────────────
CREATE TABLE IF NOT EXISTS public.meetings (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title         TEXT NOT NULL,
  date          TEXT NOT NULL,                 -- ISO date ou 'Hoje', 'Amanhã'
  time          TEXT NOT NULL,                 -- '14:00 - 15:00'
  client        TEXT DEFAULT 'Interno',
  platform      TEXT DEFAULT 'Google Meet',
  is_today      BOOLEAN DEFAULT FALSE,
  sort_order    INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.meetings IS 'Reuniões e agendamentos';

CREATE INDEX IF NOT EXISTS idx_meetings_date ON public.meetings(date);


-- ─── 2.11 ACADEMY TRILHAS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.academy_trilhas (
  id            INTEGER PRIMARY KEY,
  title         TEXT NOT NULL,
  image_url     TEXT,
  duration      TEXT NOT NULL,                 -- '2h 30m'
  total_videos  INTEGER DEFAULT 0,
  sort_order    INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.academy_trilhas IS 'Trilhas de conhecimento da Academy';


-- ─── 2.12 ACADEMY PROGRESSO ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.academy_progress (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id      TEXT NOT NULL,                 -- 'hero-kickoff', 'trilha-1', etc.
  watched_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, video_id)
);

COMMENT ON TABLE public.academy_progress IS 'Progresso de visualização da Academy por usuário';

CREATE INDEX IF NOT EXISTS idx_academy_user ON public.academy_progress(user_id);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. FUNCTIONS & TRIGGERS
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── 3.1 Auto-update updated_at ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em todas as tabelas com updated_at
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'profiles', 'tasks', 'clients', 'crm_leads',
    'transactions', 'content_items', 'meetings'
  ]) LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS set_updated_at ON public.%I; CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();',
      t, t
    );
  END LOOP;
END;
$$;


-- ─── 3.2 Auto-criar profile ao signup ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ─── 3.3 CRM → Financeiro: lead ganho gera receita automática ───────────────
CREATE OR REPLACE FUNCTION public.handle_lead_won()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando lead muda pra "ganho" gera entrada automática no financeiro
  IF NEW.column_id = 'ganho' AND (OLD.column_id IS NULL OR OLD.column_id != 'ganho') THEN
    INSERT INTO public.transactions (title, category, date, amount, type)
    VALUES (
      'Venda: ' || NEW.title,
      'Vendas CRM',
      COALESCE(NEW.date, to_char(NOW(), 'YYYY-MM-DD')),
      NEW.value,
      'income'::transaction_type
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_lead_won ON public.crm_leads;
CREATE TRIGGER on_lead_won
  AFTER UPDATE OF column_id ON public.crm_leads
  FOR EACH ROW EXECUTE FUNCTION public.handle_lead_won();


-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_trilhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_progress ENABLE ROW LEVEL SECURITY;

-- ─── Helper: checa se é ADMIN ou EQUIPE ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_team_member()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('ADMIN', 'EQUIPE')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;


-- ─── PROFILES ────────────────────────────────────────────────────────────────
-- Usuários veem o próprio perfil; ADMIN/EQUIPE veem todos
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_select_team" ON public.profiles
  FOR SELECT USING (public.is_team_member());

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);


-- ─── TASK STATUSES (lookup — todos autenticados leem) ────────────────────────
CREATE POLICY "task_statuses_select" ON public.task_statuses
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "task_statuses_manage" ON public.task_statuses
  FOR ALL USING (public.is_team_member());


-- ─── TASKS ───────────────────────────────────────────────────────────────────
CREATE POLICY "tasks_select" ON public.tasks
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "tasks_manage" ON public.tasks
  FOR ALL USING (public.is_team_member());


-- ─── CLIENT STATUSES ─────────────────────────────────────────────────────────
CREATE POLICY "client_statuses_select" ON public.client_statuses
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "client_statuses_manage" ON public.client_statuses
  FOR ALL USING (public.is_team_member());


-- ─── CLIENTS ─────────────────────────────────────────────────────────────────
CREATE POLICY "clients_select" ON public.clients
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "clients_manage" ON public.clients
  FOR ALL USING (public.is_team_member());


-- ─── CRM COLUMNS ────────────────────────────────────────────────────────────
CREATE POLICY "crm_columns_select" ON public.crm_columns
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "crm_columns_manage" ON public.crm_columns
  FOR ALL USING (public.is_team_member());


-- ─── CRM LEADS ──────────────────────────────────────────────────────────────
CREATE POLICY "crm_leads_select" ON public.crm_leads
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "crm_leads_manage" ON public.crm_leads
  FOR ALL USING (public.is_team_member());


-- ─── TRANSACTIONS ────────────────────────────────────────────────────────────
-- Somente ADMIN/EQUIPE acessam dados financeiros
CREATE POLICY "transactions_team_only" ON public.transactions
  FOR ALL USING (public.is_team_member());


-- ─── CONTENT ITEMS ───────────────────────────────────────────────────────────
CREATE POLICY "content_select" ON public.content_items
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "content_manage" ON public.content_items
  FOR ALL USING (public.is_team_member());

-- Clientes podem atualizar feedback/status de conteúdos
CREATE POLICY "content_client_update" ON public.content_items
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'CLIENTE')
  );


-- ─── MEETINGS ────────────────────────────────────────────────────────────────
CREATE POLICY "meetings_select" ON public.meetings
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "meetings_manage" ON public.meetings
  FOR ALL USING (public.is_team_member());


-- ─── ACADEMY TRILHAS ─────────────────────────────────────────────────────────
CREATE POLICY "academy_trilhas_select" ON public.academy_trilhas
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "academy_trilhas_manage" ON public.academy_trilhas
  FOR ALL USING (public.is_team_member());


-- ─── ACADEMY PROGRESS ────────────────────────────────────────────────────────
CREATE POLICY "academy_progress_select_own" ON public.academy_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "academy_progress_insert_own" ON public.academy_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "academy_progress_delete_own" ON public.academy_progress
  FOR DELETE USING (auth.uid() = user_id);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. SEED DATA — Dados iniciais (espelhando data.ts)
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── 5.1 Task Statuses ──────────────────────────────────────────────────────
INSERT INTO public.task_statuses (id, name, color, sort_order) VALUES
  ('s1', 'PENDENTE', '#e8384f', 1),
  ('s2', 'REVISÃO INTERNA FINAL', '#f2c744', 2),
  ('s3', 'EM APROVAÇÃO COM CLIENTE', '#fd7120', 3),
  ('s4', 'PRONTO PARA POSTAR', '#20c997', 4)
ON CONFLICT (id) DO NOTHING;


-- ─── 5.2 Tasks ──────────────────────────────────────────────────────────────
INSERT INTO public.tasks (id, name, status_id, assignees, due_date, priority, tags, sort_order) VALUES
  ('t1', '[KiDelícia] Roteiro gravação Abril - Rede social | Mar/26', 's2',
    ARRAY['https://i.pravatar.cc/150?u=1'], '4 dias atrás', 'High', '[]'::JSONB, 1),
  ('t2', '[KiDelícia] Campanha de Branding | Fev/25', 's3',
    ARRAY['https://i.pravatar.cc/150?u=2'], '', 'Low',
    '[{"name":"standby","color":"#ff7070","bgColor":"rgba(255, 112, 112, 0.15)"}]'::JSONB, 2),
  ('t3', '[KiDelícia] triângulo amoroso - Estático | Mar/26', 's3',
    ARRAY['https://i.pravatar.cc/150?u=3'], '', 'High',
    '[{"name":"alteração","color":"#20c997","bgColor":"rgba(32, 201, 151, 0.15)"}]'::JSONB, 3),
  ('t4', '[KiDelícia] Aviso semana santa - Estático | Mar/26', 's3',
    ARRAY['https://i.pravatar.cc/150?u=4'], '', 'Normal', '[]'::JSONB, 4),
  ('t5', '[KiDelícia] pãozinho com uma coca - Carrossel | Mar/26', 's4',
    ARRAY['https://i.pravatar.cc/150?u=5'], '', 'None', '[]'::JSONB, 5),
  ('t11', '[KiDelícia] O caminho da felicidade - Estático | Mar/26', 's4',
    ARRAY['https://i.pravatar.cc/150?u=11'], '', 'None', '[]'::JSONB, 6)
ON CONFLICT (id) DO NOTHING;


-- ─── 5.3 Client Statuses ────────────────────────────────────────────────────
INSERT INTO public.client_statuses (id, name, color, sort_order) VALUES
  ('cs1', 'CHURNED/LOST', '#6b7280', 1),
  ('cs2', 'ACTIVE CLIENT', '#b328f6', 2),
  ('cs3', 'ONBOARDING', '#20c997', 3),
  ('cs4', 'NEGOTIATING', '#f2c744', 4),
  ('cs5', 'CONTACTED', '#00a2ff', 5),
  ('cs6', 'NEW CLIENT', '#e8384f', 6)
ON CONFLICT (id) DO NOTHING;


-- ─── 5.4 Clients ────────────────────────────────────────────────────────────
INSERT INTO public.clients (id, name, status_id, assignees, faturamento, segmento, repositorio, ultima_reuniao) VALUES
  ('c1', 'TechCorp Solutions', 'cs2',
    ARRAY['https://i.pravatar.cc/150?u=12'], 'R$ 15.000,00', 'Tecnologia', 'Google Drive', '31/10/2023'),
  ('c4', 'Pão de Queijo KiDelícia', 'cs2',
    ARRAY['https://i.pravatar.cc/150?u=15'], 'R$ 12.000,00', 'Alimentação', 'Google Drive', '15/11/2023')
ON CONFLICT (id) DO NOTHING;


-- ─── 5.5 CRM Columns ────────────────────────────────────────────────────────
INSERT INTO public.crm_columns (id, title, color, sort_order) VALUES
  ('leads',    'Leads',             'bg-blue-500',   1),
  ('agendada', 'Reunião Agendada',  'bg-purple-500', 2),
  ('proposta', 'Proposta Enviada',  'bg-orange-500', 3),
  ('ganho',    'Fechado (Ganho)',   'bg-green-500',  4),
  ('perdido',  'Perdido',           'bg-red-500',    5)
ON CONFLICT (id) DO NOTHING;


-- ─── 5.6 CRM Leads ──────────────────────────────────────────────────────────
INSERT INTO public.crm_leads (id, column_id, title, value, date, sort_order) VALUES
  ('l1', 'agendada', 'TechCorp Solutions',  15000, to_char(NOW(), 'YYYY-MM-DD'), 1),
  ('l2', 'agendada', 'EducaMais EAD',        8500, to_char(NOW(), 'YYYY-MM-DD'), 2),
  ('l3', 'agendada', 'Clinica Sorriso',      5000, to_char(NOW(), 'YYYY-MM-DD'), 3),
  ('l4', 'leads',    'Nova Startup XYZ',    12000, to_char(NOW(), 'YYYY-MM-DD'), 4),
  ('l5', 'proposta', 'Indústria ABC',       35000, to_char(NOW(), 'YYYY-MM-DD'), 5)
ON CONFLICT (id) DO NOTHING;


-- ─── 5.7 Transactions ───────────────────────────────────────────────────────
INSERT INTO public.transactions (title, category, date, amount, type) VALUES
  ('Fee Mensal - Loja XYZ',      'Fee Mensal',   to_char(NOW(), 'YYYY-MM-DD'),  5000, 'income'),
  ('Meta Ads',                    'Tráfego',      to_char(NOW(), 'YYYY-MM-DD'), -2000, 'expense'),
  ('Software (Figma, Adobe)',     'Ferramentas',  to_char(NOW(), 'YYYY-MM-DD'),  -450, 'expense'),
  ('Fee Mensal - TechCorp',       'Fee Mensal',   to_char(NOW(), 'YYYY-MM-DD'), 15000, 'income');


-- ─── 5.8 Content Items ──────────────────────────────────────────────────────
INSERT INTO public.content_items (title, type, status, date, feedback, thumbnail, color, text_color) VALUES
  ('Campanha Black Friday - Vídeo Principal', 'video', 'PENDENTE',
    to_char(NOW(), 'YYYY-MM-DD'), NULL, 'N', 'from-red-900 to-black', 'text-red-600'),
  ('Carrossel Instagram - Lançamento Produto X', 'image', 'REVISÃO',
    to_char(NOW() - INTERVAL '1 day', 'YYYY-MM-DD'), 'Aumentar o logo na segunda imagem.',
    'img', 'from-pink-600 to-orange-500', 'text-white'),
  ('Apresentação Comercial Q4', 'pdf', 'APROVADO',
    to_char(NOW() - INTERVAL '5 days', 'YYYY-MM-DD'), NULL, 'pdf', 'bg-gray-200', 'text-gray-800');


-- ─── 5.9 Meetings ───────────────────────────────────────────────────────────
INSERT INTO public.meetings (title, date, time, client, platform, is_today) VALUES
  ('Apresentação de Resultados - Q3', to_char(NOW(), 'YYYY-MM-DD'),
    '14:00 - 15:00', 'TechCorp', 'Google Meet', TRUE),
  ('Reunião de Alinhamento Semanal', to_char(NOW() + INTERVAL '1 day', 'YYYY-MM-DD'),
    '10:00 - 11:00', 'Equipe Interna', 'Zoom', FALSE),
  ('Kickoff Novo Projeto', to_char(NOW() + INTERVAL '3 days', 'YYYY-MM-DD'),
    '16:30 - 17:30', 'EducaMais', 'Google Meet', FALSE);


-- ─── 5.10 Academy Trilhas ───────────────────────────────────────────────────
INSERT INTO public.academy_trilhas (id, title, image_url, duration, total_videos, sort_order) VALUES
  (1, 'Onboarding',
    'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?q=80&w=2070&auto=format&fit=crop',
    '2h 30m', 5, 1),
  (2, 'Gestão de Comercial',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2015&auto=format&fit=crop',
    '5h 15m', 12, 2),
  (3, 'Design & Criativos',
    'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1974&auto=format&fit=crop',
    '3h 45m', 8, 3),
  (4, 'Atendimento Pró',
    'https://images.unsplash.com/photo-1553877522-43269d4ea984?q=80&w=2070&auto=format&fit=crop',
    '1h 20m', 3, 4)
ON CONFLICT (id) DO NOTHING;


-- ═══════════════════════════════════════════════════════════════════════════════
-- 6. REALTIME — Habilitar para tabelas que precisam de sync ao vivo
-- ═══════════════════════════════════════════════════════════════════════════════

-- No Supabase, Realtime é habilitado por tabela via Dashboard ou:
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_leads;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.content_items;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.meetings;

-- Descomente as linhas acima se quiser habilitar Realtime automaticamente.


-- ═══════════════════════════════════════════════════════════════════════════════
-- 7. VIEWS AUXILIARES (opcionais, para Dashboard)
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── 7.1 Resumo Financeiro ───────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.vw_financial_summary AS
SELECT
  COUNT(*) FILTER (WHERE type = 'income')  AS total_income_count,
  COUNT(*) FILTER (WHERE type = 'expense') AS total_expense_count,
  COALESCE(SUM(amount) FILTER (WHERE type = 'income'), 0) AS total_revenue,
  COALESCE(SUM(ABS(amount)) FILTER (WHERE type = 'expense'), 0) AS total_expenses,
  COALESCE(SUM(amount) FILTER (WHERE type = 'income'), 0)
    - COALESCE(SUM(ABS(amount)) FILTER (WHERE type = 'expense'), 0) AS net_profit
FROM public.transactions;

-- ─── 7.2 Resumo CRM Pipeline ────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.vw_crm_pipeline AS
SELECT
  c.id AS column_id,
  c.title AS column_title,
  c.sort_order,
  COUNT(l.id) AS lead_count,
  COALESCE(SUM(l.value), 0) AS total_value
FROM public.crm_columns c
LEFT JOIN public.crm_leads l ON l.column_id = c.id
GROUP BY c.id, c.title, c.sort_order
ORDER BY c.sort_order;

-- ─── 7.3 Resumo Content Status ──────────────────────────────────────────────
CREATE OR REPLACE VIEW public.vw_content_summary AS
SELECT
  status,
  COUNT(*) AS count
FROM public.content_items
GROUP BY status;


-- ═══════════════════════════════════════════════════════════════════════════════
-- ✅ SCHEMA COMPLETO — Pronto para colar no SQL Editor do Supabase
-- ═══════════════════════════════════════════════════════════════════════════════
