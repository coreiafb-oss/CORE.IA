const URL = 'https://vkzpbrrdclacbyxbosti.supabase.co';
const KEY = 'sb_publishable_MRJlEUpr9zGrHnFubVix2A_ghyM-enV';

async function testSupabase() {
  const payload = {
    title: '🎥 Gravação: TESTE DE MESA (SUPABASE)',
    date: new Date().toISOString().split('T')[0],
    time: '09:00 - 11:30',
    client: 'LINE',
    platform: 'Presencial',
    is_today: true
  };

  try {
    const res = await fetch(`${URL}/rest/v1/meetings`, {
      method: 'POST',
      headers: {
        'apikey': KEY,
        'Authorization': `Bearer ${KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('❌ ERRO AO INSERIR NO SUPABASE:', res.status, err);
    } else {
      const data = await res.json();
      console.log('✅ SUCESSO ABSOLUTO! Tabela existe e o dado foi ejetado:', data);
    }
  } catch (error) {
    console.error('❌ ERRO DE CONEXÃO:', error);
  }
}

testSupabase();
