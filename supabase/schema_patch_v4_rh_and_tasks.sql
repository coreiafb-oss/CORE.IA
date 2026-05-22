-- =================================================================================
-- PATCH V4.1: Correção Equipe & RH
-- Execute este script no SQL Editor do Supabase
-- =================================================================================

-- 1. Criação/Recriação da Tabela de RH com as colunas corretas
DROP TABLE IF EXISTS public.rh_profiles CASCADE;

CREATE TABLE public.rh_profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    type_contract TEXT DEFAULT 'Freelancer', -- Ex: 'CLT', 'PJ', 'Freelancer', 'Sócio'
    email TEXT,
    phone TEXT,
    pix_key TEXT,
    cost_per_hour NUMERIC(10, 2) DEFAULT 0,
    cost_per_day NUMERIC(10, 2) DEFAULT 0,
    skills TEXT[] DEFAULT '{}',
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ativar RLS para RH
ALTER TABLE public.rh_profiles ENABLE ROW LEVEL SECURITY;

-- Políticas de RH (Admins e Equipe podem ver/editar tudo)
-- IMPORTANTE: No momento, liberando RLS geral para testes de inserção. 
-- Em produção, restrinja se necessário.
CREATE POLICY "Acesso total ao RH" 
ON public.rh_profiles 
FOR ALL USING (true);

-- 2. Adicionar 'client_email' na tabela content_items (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_items' AND column_name = 'client_email') THEN
        ALTER TABLE public.content_items ADD COLUMN client_email TEXT;
    END IF;
END $$;

-- 3. Adicionar tabelas de comentário e anexo nas tarefas (se não existirem da V2)
CREATE TABLE IF NOT EXISTS public.task_comments (
    id TEXT PRIMARY KEY,
    task_id TEXT REFERENCES public.tasks(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    author_avatar TEXT,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS nos comentários de tarefas
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir tudo em task_comments para autenticados" ON public.task_comments;
CREATE POLICY "Permitir tudo em task_comments para autenticados" 
ON public.task_comments FOR ALL TO authenticated USING (true);

-- Notificar PostgREST
NOTIFY pgrst, 'reload schema';
