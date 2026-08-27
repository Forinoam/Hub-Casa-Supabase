# Retomar notificações: preferências, histórico e alertas

## Ponto de partida confirmado

- O backend já tem a tabela `notification_preferences` com permissões e RLS.
- A rotina `list_due_event_reminders` já foi ampliada para compromissos, tarefas, contas, manutenções, compras e orçamento.
- O app ainda não tem tela/serviço/hook para editar essas preferências em Configurações.
- O histórico de envios ainda não aparece na interface, embora a tabela `notification_deliveries` já exista e tenha leitura para o próprio destinatário.
- O linter ainda aponta funções `SECURITY DEFINER` executáveis por usuários logados; a função de lembretes já está restrita ao backend, então a revisão deve focar nos itens restantes e no uso de `public.is_home_member` em políticas novas/recém-alteradas.

## O que vou fazer agora

### 1. Fechar o alerta de segurança relacionado a notificações

- Revisar as permissões das funções elevadas apontadas pelo linter.
- Ajustar as políticas de `notification_preferences` para seguir o padrão mais seguro já usado na maior parte do projeto (`private.is_home_member`), evitando depender da função pública quando não for necessário.
- Manter a função de lembretes executável somente pelo backend, sem abrir chamada direta para usuários do app.

### 2. Criar preferências de notificação em Configurações

- Adicionar um card abaixo do card atual de Push com chaves liga/desliga para:
  - Compromissos da agenda
  - Tarefas do dia
  - Contas a vencer
  - Manutenções previstas
  - Lista de compras
  - Alertas de orçamento
- Adicionar controles simples para:
  - Horário do resumo diário
  - Janela de silêncio
  - Antecedência de contas
  - Antecedência de manutenções
  - Dia semanal do resumo de compras
- Se ainda não existir registro de preferência para o usuário/casa, criar automaticamente com os padrões atuais.

### 3. Mostrar histórico de notificações

- Adicionar em Configurações uma lista curta com os últimos envios.
- Exibir tipo, data, status e erro quando houver.
- Usar os dados reais de `notification_deliveries`, respeitando a política de leitura do próprio usuário.

### 4. Ajustar rótulos das notificações enviadas

- Atualizar o payload usado pelo processador para refletir o tipo real do lembrete, em vez de tratar tudo como `event_reminder`.
- Direcionar o clique para a tela correta conforme origem: calendário, tarefas, financeiro, manutenção ou compras.

### 5. Sinal visual nos itens que geram lembrete

- Adicionar um ícone discreto de sino nos cards/listas de tarefas, contas e manutenções quando o item puder gerar aviso.
- Manter o visual simples, sem mudar o fluxo principal dessas telas.

### 6. Testes e verificação

- Criar/ajustar testes para preferências, antecedência e janela de silêncio quando houver lógica testável fora do SQL.
- Verificar que Configurações carrega, salva preferências, exibe histórico e não quebra o card de push já funcional.
- Rodar o linter do backend após a migração e corrigir somente os avisos ligados a esta etapa, sem mexer em convites ou outras funções fora do escopo salvo se o alerta for causado pelo trabalho atual.

## Detalhes técnicos

- Backend: nova migração apenas para ajustes de permissões/políticas necessários; sem recriar tabelas já existentes.
- Front: adicionar `preferences.service.ts`, `use-notification-preferences.ts`, `NotificationPreferencesCard.tsx` e `NotificationHistoryCard.tsx` dentro do módulo de notificações.
- Query keys: acrescentar chaves para preferências e histórico em `qk.notifications`.
- Configurações: importar os novos cards mantendo a página como tela fina.
- Edge Function: pequenos ajustes de payload/URL por `source_type`, sem alterar VAPID nem o fluxo de envio que já está funcionando no iOS e no caminho FCM/Android.
