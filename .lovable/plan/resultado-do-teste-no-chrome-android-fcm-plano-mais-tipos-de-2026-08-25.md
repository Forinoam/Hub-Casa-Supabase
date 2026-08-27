# Resultado do teste no Chrome (Android/FCM) + Plano: mais tipos de lembrete

## Confirmação do teste

O teste feito no Chrome do computador chegou ao servidor de push do Google:

- Nova inscrição registrada hoje às 11:07 com endpoint `fcm.googleapis.com` (as outras 4 são Apple).
- A notificação de teste para essa inscrição FCM foi entregue: status `sent`, sem erro, 1 tentativa.
- Um lembrete real de compromisso ("Entrevista") também saiu pela mesma inscrição FCM com status `sent`.

Como Chrome desktop e Chrome Android usam exatamente o mesmo serviço (FCM) e o mesmo formato VAPID/Web Push, o caminho Android está validado ponta a ponta no servidor. O que resta variar no celular é comportamento local do aparelho (economia de bateria, Doze), já mitigado com TTL de 24h e urgência alta.

## O que já existe hoje

A rotina de lembretes já busca quatro origens: compromissos da agenda, tarefas com data, contas a pagar e manutenções previstas. Porém:

- Só a agenda tem controle de lembrete na interface (minutos antes). Tarefas, contas e manutenções disparam sempre às 09:00, sem opção de ligar/desligar.
- Não existe nenhuma preferência por usuário: quem ativa o push recebe tudo.
- Não há aviso de compras nem de orçamento estourado.

## Objetivo desta etapa

Dar controle ao usuário sobre quais lembretes recebe e ampliar os tipos.

### 1. Preferências de notificação (por pessoa)

Nova tela dentro de Configurações, abaixo do cartão de push, com chaves liga/desliga:

- Compromissos da agenda
- Tarefas do dia
- Contas a vencer
- Manutenções previstas
- Lista de compras (resumo semanal)
- Alerta de orçamento estourado

Mais dois ajustes globais: horário do resumo diário (padrão 09:00) e "não perturbe" (silenciar entre um horário e outro, ex.: 22:00–07:00).

### 2. Antecedência configurável

- Contas a pagar: escolher aviso no dia, 1 dia antes ou 3 dias antes.
- Manutenções: aviso no dia ou 3 dias antes.
- Tarefas: usar o horário definido na tarefa quando houver, senão o horário do resumo diário.

### 3. Novos tipos de lembrete

- **Lista de compras**: no dia/horário escolhido, se houver itens pendentes, avisa quantos itens faltam.
- **Orçamento**: quando uma categoria passa de 90% ou estoura o limite do mês, envia um alerta (no máximo um por categoria por mês).

### 4. Ajustes de UX

- Cada item da lista (tarefa, conta, manutenção) mostra um ícone discreto de sino quando gerará lembrete.
- Tela de histórico simples em Configurações: últimas notificações enviadas, com data e status, para você conferir sem precisar me perguntar.

## Detalhes técnicos

- Nova tabela `notification_preferences` (por `home_id` + `user_id`): flags por tipo, `daily_digest_time`, `quiet_hours_start/end`, `bill_lead_days`, `maintenance_lead_days`. RLS + GRANT no padrão do projeto (leitura/escrita apenas do próprio registro dentro da casa).
- `public.list_due_event_reminders` é reescrita para: (a) juntar as preferências do destinatário e filtrar tipos desligados, (b) aplicar `lead_days` nas contas e manutenções, (c) respeitar quiet hours adiando o envio para o fim da janela, (d) somar as novas origens (compras pendentes e orçamentos estourados). O nome da função é mantido para não quebrar a Edge Function; a descrição da origem passa a vir junto no `payload`.
- Orçamento: origem calculada a partir de `budgets` versus soma de `expenses` do mês corrente, com `dedupe_key` mensal por categoria — sem tabela nova.
- Edge Function `notification-processor` continua igual no fluxo de envio; só passa a rotular ícone/url conforme `source_type`.
- Front: módulo `src/modules/notifications` ganha `preferences.service.ts`, `use-notification-preferences.ts` e `NotificationPreferencesCard.tsx`, seguindo o fluxo Página → Hook → Service. Histórico lê `notification_deliveries` (já tem policy de leitura).
- Testes: casos no Vitest para filtro por preferência, lead days e janela de silêncio no model de lembretes.
