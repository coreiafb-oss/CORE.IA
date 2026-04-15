/**
 * INTEGRAÇÃO GOOGLE FORMS -> GOOGLE CALENDAR -> SUPABASE (LINE OS)
 * 
 * Instruções:
 * 1. Abra o seu Google Form (Relatório de Gravação) no modo de edição.
 * 2. Clique nos 3 pontinhos (Mais) no canto superior direito -> "Editor de script".
 * 3. Copie todo este código e cole lá (substituindo o padrão).
 * 4. Preencha as configurações na const CONFIG abaixo com as chaves do seu Supabase.
 * 5. Clique em "Salvar".
 * 6. Vá no menu "Acionadores" (ícone de relógio na esquerda) e adicione um acionador:
 *    - Escolha a função: "onFormSubmit"
 *    - Evento: "Do formulário" -> "Ao enviar"
 * 7. Salve e aprove as permissões do Google.
 */

const CONFIG = {
  // O ID da agenda onde os eventos devem ser criados (Seu e-mail ou ID do calendário da produtora)
  CALENDAR_ID: 'primary', // 'primary' usa o calendário do dono do script.
  
  // Como as perguntas do formulário estão nomeadas? (Exatamente como aparecem no texto da pergunta)
  // Ajuste estes títulos de acordo com o seu Forms!
  FIELD_DATE: 'Data da Gravação',
  FIELD_TIME_START: 'Horário de Início', 
  FIELD_TIME_END: 'Horário de Término',
  FIELD_TITLE: 'Título / Projeto',
  FIELD_VIDEOMAKER: 'Quem é o Videomaker?',
  FIELD_DETAILS: 'Detalhes / Resumo da Gravação',

  // Configurações do LINE OS (Supabase) - ENCONTRE ESSAS CHAVES NA ABA "API" DO PROJECT SETTINGS NO SUPABASE
  SUPABASE_URL: 'SUA_SUPABASE_URL_AQUI',
  SUPABASE_ANON_KEY: 'SUA_SUPABASE_ANON_KEY_AQUI',
};

function onFormSubmit(e) {
  try {
    // 1. Extrair as respostas do formulário
    const itemResponses = e.response.getItemResponses();
    let dataMap = {};
    
    itemResponses.forEach(item => {
      dataMap[item.getItem().getTitle()] = item.getResponse();
    });

    // 2. Extrair dados para montar o evento
    const dateStr = dataMap[CONFIG.FIELD_DATE] || '2025-01-01'; // 'YYYY-MM-DD' gerado pelo Forms
    const timeStart = dataMap[CONFIG.FIELD_TIME_START] || '09:00';
    const timeEnd = dataMap[CONFIG.FIELD_TIME_END] || '12:00';
    const title = dataMap[CONFIG.FIELD_TITLE] || 'Gravação Agendada';
    const description = `Videomaker: ${dataMap[CONFIG.FIELD_VIDEOMAKER]}\n\nDetalhes:\n${dataMap[CONFIG.FIELD_DETAILS]}`;

    // 3. Cadastrar no Google Calendar
    const eventStartTime = new Date(`${dateStr}T${timeStart}:00`);
    const eventEndTime = new Date(`${dateStr}T${timeEnd}:00`);
    
    const calendar = CalendarApp.getCalendarById(CONFIG.CALENDAR_ID);
    const event = calendar.createEvent(`🎥 ${title}`, eventStartTime, eventEndTime, {
      description: description
    });
    
    // 4. Cadastrar no LINE OS (Supabase) via API REST
    // Insere como uma "Reunião/Agendamento" na tabela `meetings` para refletir na Agenda do sistema
    if (CONFIG.SUPABASE_URL !== 'SUA_SUPABASE_URL_AQUI') {
      const payload = {
        title: `🎥 Gravação: ${title}`,
        date: dateStr,
        time: `${timeStart} - ${timeEnd}`,
        client: dataMap[CONFIG.FIELD_VIDEOMAKER] || 'Interno',
        platform: 'Externo/Presencial',
        is_today: false // Na integração React pode ser tratado iterativamente
      };
      
      const options = {
        method: 'post',
        contentType: 'application/json',
        headers: {
          'apikey': CONFIG.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
          'Prefer': 'return=minimal'
        },
        payload: JSON.stringify(payload)
      };
      
      UrlFetchApp.fetch(`${CONFIG.SUPABASE_URL}/rest/v1/meetings`, options);
    }
    
    Logger.log('Integração Concluída. Evento GCal: ' + event.getId());
    
  } catch(error) {
    Logger.log('Erro na integração: ' + error.toString());
  }
}
