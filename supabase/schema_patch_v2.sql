-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║           LINE OS — PATCH SQL v2: Realtime + Lead Activities               ║
-- ║                                                                            ║
-- ║  Execute este patch NO SQL Editor do Supabase APÓS o schema principal.     ║
-- ║  Este patch é seguro para reexecução (idempotente).                        ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. NOVAS TABELAS
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── 1.1 Lead Activities (timeline de eventos CRM) ───────────────────────────
-- Substituí o JSONB activities embedded no lead por tabela normalizada.
CREATE TABLE IF NOT EXISTS public.lead_activities (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  lead_id     TEXT NOT NULL REFERENCES public.crm_leads(id) ON DELETE CASCADE,
  type        TEXT NOT NULL DEFAULT 'note',  -- 'note','status_change','email','call','task_created','created'
  content     TEXT NOT NULL,
  author_name TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.lead_activities IS 'Timeline de atividades de cada lead CRM';
CREATE INDEX IF NOT EXISTS idx_lead_activities_lead ON public.lead_activities(lead_id);

-- ─── 1.2 Lead Tasks (checklist de tarefas por lead) ──────────────────────────
CREATE TABLE IF NOT EXISTS public.lead_tasks (
  id        UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  lead_id   TEXT NOT NULL REFERENCES public.crm_leads(id) ON DELETE CASCADE,
  title     TEXT NOT NULL,
  due_date  TEXT,
  due_time  TEXT,
  done      BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.lead_tasks IS 'Tarefas vinculadas a cada lead CRM';
CREATE INDEX IF NOT EXISTS idx_lead_tasks_lead ON public.lead_tasks(lead_id);

-- ─── 1.3 Task Comments (comentários de tarefas no Gestor) ────────────────────
CREATE TABLE IF NOT EXISTS public.task_comments (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  task_id       TEXT NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  author_name   TEXT NOT NULL,
  author_avatar TEXT NOT NULL,
  content       TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.task_comments IS 'Comentários nas tarefas do Gestor';
CREATE INDEX IF NOT EXISTS idx_task_comments_task ON public.task_comments(task_id);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. ROW LEVEL SECURITY — Novas tabelas
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_tasks      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments   ENABLE ROW LEVEL SECURITY;

-- Lead Activities: mesma regra dos leads
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='lead_activities' AND policyname='lead_activities_select') THEN
    CREATE POLICY "lead_activities_select" ON public.lead_activities
      FOR SELECT USING (auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='lead_activities' AND policyname='lead_activities_manage') THEN
    CREATE POLICY "lead_activities_manage" ON public.lead_activities
      FOR ALL USING (public.is_team_member());
  END IF;
END $$;

-- Lead Tasks
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='lead_tasks' AND policyname='lead_tasks_select') THEN
    CREATE POLICY "lead_tasks_select" ON public.lead_tasks
      FOR SELECT USING (auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='lead_tasks' AND policyname='lead_tasks_manage') THEN
    CREATE POLICY "lead_tasks_manage" ON public.lead_tasks
      FOR ALL USING (public.is_team_member());
  END IF;
END $$;

-- Task Comments
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='task_comments' AND policyname='task_comments_select') THEN
    CREATE POLICY "task_comments_select" ON public.task_comments
      FOR SELECT USING (auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='task_comments' AND policyname='task_comments_manage') THEN
    CREATE POLICY "task_comments_manage" ON public.task_comments
      FOR ALL USING (public.is_team_member());
  END IF;
END $$;


-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. REALTIME — Habilitar para todas as tabelas ativas
-- ═══════════════════════════════════════════════════════════════════════════════

-- NOTA: Supabase requer ROW-LEVEL SECURITY habilitado antes de adicionar ao Realtime.
-- Todas as tabelas já têm RLS habilitado. Execute os comandos abaixo:

ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_leads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.content_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.meetings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.clients;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lead_activities;
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_comments;


-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. ÍNDICES ADICIONAIS — Performance
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_tasks_updated_at     ON public.tasks(updated_at);
CREATE INDEX IF NOT EXISTS idx_leads_updated_at     ON public.crm_leads(updated_at);
CREATE INDEX IF NOT EXISTS idx_content_updated_at   ON public.content_items(updated_at);
CREATE INDEX IF NOT EXISTS idx_meetings_updated_at  ON public.meetings(updated_at);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. TRIGGER — Auto updated_at nas novas tabelas (lead_tasks, lead_activities não
--    precisam pois são append-only, mas task_comments sim se editável no futuro)
-- ═══════════════════════════════════════════════════════════════════════════════

-- (Não aplicado nas novas tabelas pois são append-only por design)


-- ═══════════════════════════════════════════════════════════════════════════════
-- 6. VIEW — Resumo por Status de Tarefa
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW public.vw_tasks_by_status AS
SELECT
  ts.id AS status_id,
  ts.name AS status_name,
  ts.color,
  COUNT(t.id) AS total_tasks,
  COUNT(t.id) FILTER (WHERE t.priority = 'Urgent') AS urgent_count,
  COUNT(t.id) FILTER (WHERE t.priority = 'High')   AS high_count
FROM public.task_statuses ts
LEFT JOIN public.tasks t ON t.status_id = ts.id
GROUP BY ts.id, ts.name, ts.color, ts.sort_order
ORDER BY ts.sort_order;

COMMENT ON VIEW public.vw_tasks_by_status IS 'Resumo de tarefas agrupadas por status para o Dashboard';


-- ═══════════════════════════════════════════════════════════════════════════════
-- 7. VIEW — Resumo de Leads por Coluna (atualizado com contagem de activities)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW public.vw_crm_pipeline AS
SELECT
  c.id AS column_id,
  c.title AS column_title,
  c.sort_order,
  COUNT(DISTINCT l.id) AS lead_count,
  COALESCE(SUM(l.value), 0) AS total_value,
  COUNT(la.id) AS total_activities
FROM public.crm_columns c
LEFT JOIN public.crm_leads l ON l.column_id = c.id
LEFT JOIN public.lead_activities la ON la.lead_id = l.id
GROUP BY c.id, c.title, c.sort_order
ORDER BY c.sort_order;

COMMENT ON VIEW public.vw_crm_pipeline IS 'Pipeline CRM com contagem de atividades por coluna';


-- ═══════════════════════════════════════════════════════════════════════════════
-- ✅ PATCH v2 COMPLETO
-- ═══════════════════════════════════════════════════════════════════════════════
