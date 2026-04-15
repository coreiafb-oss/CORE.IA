import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

// ─── Database Types (inline — gerado a partir do schema.sql) ──────────────────
export type UserRole = 'ADMIN' | 'EQUIPE' | 'CLIENTE';
export type TaskPriority = 'Urgent' | 'High' | 'Normal' | 'Low' | 'None';
export type TransactionType = 'income' | 'expense';
export type ContentStatusDB = 'PENDENTE' | 'REVISÃO' | 'ALTERAÇÃO' | 'APROVADO';
export type ContentTypeDB = 'video' | 'image' | 'pdf';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          role: UserRole;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      tasks: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          status_id: string;
          assignees: string[];
          due_date: string | null;
          priority: TaskPriority;
          tags: Record<string, unknown>[];
          related_task_ids: string[];
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['tasks']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Database['public']['Tables']['tasks']['Insert']>;
      };
      task_statuses: {
        Row: { id: string; name: string; color: string; sort_order: number; created_at: string };
        Insert: Omit<Database['public']['Tables']['task_statuses']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['task_statuses']['Insert']>;
      };
      clients: {
        Row: {
          id: string;
          name: string;
          status_id: string;
          assignees: string[];
          faturamento: string | null;
          segmento: string | null;
          repositorio: string | null;
          ultima_reuniao: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['clients']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Database['public']['Tables']['clients']['Insert']>;
      };
      client_statuses: {
        Row: { id: string; name: string; color: string; sort_order: number; created_at: string };
        Insert: Omit<Database['public']['Tables']['client_statuses']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['client_statuses']['Insert']>;
      };
      crm_columns: {
        Row: { id: string; title: string; color: string; sort_order: number; created_at: string };
        Insert: Omit<Database['public']['Tables']['crm_columns']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['crm_columns']['Insert']>;
      };
      crm_leads: {
        Row: {
          id: string;
          column_id: string;
          title: string;
          value: number;
          date: string;
          contact_name: string | null;
          email: string | null;
          phone: string | null;
          company_name: string | null;
          company_email: string | null;
          company_phone: string | null;
          company_cnpj: string | null;
          company_address: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['crm_leads']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Database['public']['Tables']['crm_leads']['Insert']>;
      };
      transactions: {
        Row: {
          id: number;
          title: string;
          category: string;
          date: string;
          amount: number;
          type: TransactionType;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['transactions']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['transactions']['Insert']>;
      };
      content_items: {
        Row: {
          id: number;
          title: string;
          type: ContentTypeDB;
          status: ContentStatusDB;
          date: string;
          feedback: string | null;
          thumbnail: string;
          color: string;
          text_color: string;
          linked_task_id: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['content_items']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['content_items']['Insert']>;
      };
      meetings: {
        Row: {
          id: number;
          title: string;
          date: string;
          time: string;
          client: string;
          platform: string;
          is_today: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['meetings']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['meetings']['Insert']>;
      };
      lead_activities: {
        Row: {
          id: string;
          lead_id: string;
          type: string;
          content: string;
          author_name: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['lead_activities']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['lead_activities']['Insert']>;
      };
      lead_tasks: {
        Row: {
          id: string;
          lead_id: string;
          title: string;
          due_date: string | null;
          due_time: string | null;
          done: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['lead_tasks']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['lead_tasks']['Insert']>;
      };
      task_comments: {
        Row: {
          id: string;
          task_id: string;
          author_name: string;
          author_avatar: string;
          content: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['task_comments']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['task_comments']['Insert']>;
      };
    };
    Views: {
      vw_financial_summary: {
        Row: {
          total_income_count: number;
          total_expense_count: number;
          total_revenue: number;
          total_expenses: number;
          net_profit: number;
        };
      };
      vw_crm_pipeline: {
        Row: {
          column_id: string;
          column_title: string;
          sort_order: number;
          lead_count: number;
          total_value: number;
        };
      };
    };
  };
}

// ─── Supabase Client Singleton ─────────────────────────────────────────────────
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _supabase: SupabaseClient<any> | null = null;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[LINE OS] ⚠️  Variáveis de ambiente Supabase não configuradas.\n' +
    '  Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env.\n' +
    '  O sistema cairá para modo local (localStorage) até isso ser corrigido.'
  );
} else {
  _supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });
}

export const supabase = _supabase;

/**
 * Guard type-safe para garantir que Supabase está configurado antes de usar.
 * Lança erro explicativo ao invés de falhar silenciosamente.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function requireSupabase(): SupabaseClient<any> {
  if (!_supabase) {
    throw new Error(
      '[LINE OS] Supabase não está configurado. ' +
      'Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env.'
    );
  }
  return _supabase;
}

/** Verifica se o Supabase está disponível sem lançar erro */
export const isSupabaseAvailable = (): boolean => _supabase !== null;
