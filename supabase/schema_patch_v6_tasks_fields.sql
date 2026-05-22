-- =================================================================================
-- PATCH V6: Adição de Campos de Timer, Subtarefas e Correção do Storage de Avatares
-- Execute este script no SQL Editor do Supabase
-- =================================================================================

-- 1. Adicionar colunas faltantes na tabela public.tasks
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'subtasks') THEN
        ALTER TABLE public.tasks ADD COLUMN subtasks JSONB DEFAULT '[]'::JSONB;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'time_spent') THEN
        ALTER TABLE public.tasks ADD COLUMN time_spent INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'is_timer_running') THEN
        ALTER TABLE public.tasks ADD COLUMN is_timer_running BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'completed_at') THEN
        ALTER TABLE public.tasks ADD COLUMN completed_at TIMESTAMPTZ;
    END IF;
END $$;

-- 2. Correção das Políticas de RLS do Bucket de Avatares
-- Para permitir que usuários enviem e gerenciem arquivos de perfil publicamente.

DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete avatars" ON storage.objects;

CREATE POLICY "Public users can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Public users can update avatars"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars');

CREATE POLICY "Public users can delete avatars"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars');

-- Notificar PostgREST para reler o schema
NOTIFY pgrst, 'reload schema';
