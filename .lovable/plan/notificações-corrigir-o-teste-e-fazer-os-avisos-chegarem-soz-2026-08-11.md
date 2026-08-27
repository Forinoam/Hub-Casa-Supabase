# Notificações: corrigir o teste e fazer os avisos chegarem sozinhos

Diagnostiquei os dois problemas com testes reais no backend (não é suposição).

## O que está acontecendo hoje

1. **"Forbidden" no botão de teste** — a função de push só aceita o modo teste se a chave enviada pelo app for exatamente igual à chave que ela mesma tem. Disparei a chamada com a chave do app e recebi `403 Forbidden`; disparei o modo lembretes com a mesma chave e funcionou (`sent: 1`). Ou seja: as duas cópias da chave não batem mais, e a comparação por igualdade de chave é o ponto frágil.
2. **Nenhum lembrete chega sozinho** — o agendador (roda a cada minuto) está falhando desde que foi criado. Todas as execuções retornam o mesmo erro: a função de chamada HTTP usada no agendamento não existe com esse nome no banco. Por isso a tabela de entregas estava vazia e o seu compromisso de teste nunca gerou aviso — quando eu chamei o processador manualmente agora, o envio ocorreu normalmente.
3. **Só compromissos têm lembrete** — a regra que lista lembretes vencidos cobre apenas a agenda. Tarefas, contas/despesas e manutenções não geram notificação nenhuma hoje.

## O que vou fazer

### 1. Consertar o disparo de teste
- Trocar a autorização do modo teste: em vez de comparar strings de chave, validar o token do usuário logado (JWT) dentro da função e enviar o push apenas para os dispositivos daquele próprio usuário.
- Assim o botão para de depender de duas cópias sincronizadas da chave secreta e o teste passa a funcionar tanto no preview quanto no app publicado.

### 2. Consertar o agendamento automático
- Recriar o job de cada minuto usando a função de chamada HTTP correta (`net.http_post` da extensão `pg_net`), com a chave pública do projeto no cabeçalho.
- Validar depois da correção que as execuções aparecem como bem-sucedidas e que as entregas mudam para `sent`.

### 3. Ampliar os lembretes para os outros módulos (se você aprovar)
- Estender a regra de lembretes para incluir:
  - **Tarefas** com data (e hora) de vencimento — aviso no dia/horário.
  - **Contas a pagar** não pagas com vencimento no dia.
  - **Manutenções** com próxima data no dia.
- Manter o mesmo mecanismo de deduplicação já existente, para não mandar aviso repetido.

## Detalhes técnicos

- Função `notification-processor`: substituir a checagem `token === serviceRoleKey` no modo `test` por verificação do JWT do usuário (validação via Supabase Auth), mantendo o modo `reminders` como está.
- `sendTestPushNotification` (server fn) passa a encaminhar o token do usuário autenticado em vez da service role.
- Migração para recriar o job de cron com `net.http_post` e remover o job quebrado (jobid 2).
- Etapa 3: nova versão de `list_due_event_reminders` (ou função irmã) unindo `events`, `tasks`, `expenses` (kind = conta) e `maintenance_items`, mantendo `dedupe_key` por origem + data agendada.

## Verificação

- Chamar o modo teste com sessão real e confirmar retorno `sent > 0`.
- Conferir as execuções do agendador sem erro por alguns minutos e as linhas de entrega com status `sent`.
- Criar um compromisso com lembrete curto e confirmar o envio automático.
