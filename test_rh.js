import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Faltam variáveis de ambiente VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY no .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRH() {
  console.log("Testando tabela rh_profiles...");
  const { data, error } = await supabase.from('rh_profiles').select('*').limit(1);
  if (error) {
    console.error("❌ ERRO AO LER rh_profiles:", error.message);
  } else {
    console.log("✅ SUCESSO! A tabela rh_profiles existe e está acessível. Dados lidos:", data);
  }

  console.log("\nTestando tabela task_comments...");
  const { data: d2, error: e2 } = await supabase.from('task_comments').select('id').limit(1);
  if (e2) {
    console.error("❌ ERRO AO LER task_comments:", e2.message);
  } else {
    console.log("✅ SUCESSO! A tabela task_comments existe e está acessível.");
  }
}

testRH();
