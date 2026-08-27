# notification-processor

Edge Function que envia as notificações push REAIS do Casa Hub (Web Push / VAPID),
implementada só com WebCrypto (`webpush.ts`) — sem dependências Node.

## Modos

| Chamada | O que faz |
| --- | --- |
| `POST /` sem corpo (ou `{"mode":"reminders"}`) | Busca lembretes vencidos, cria as entregas em `notification_deliveries` e envia o push. |
| `POST /` com `{"mode":"test","userId":"...","homeId":"..."}` | Envia um push de teste para os dispositivos daquele usuário. Exige a service role — é usado pelo botão "Enviar notificação de teste" em Configurações. |

Ambas as chamadas exigem `Authorization: Bearer <chave>`:
a service role para o modo `test`, service role ou anon key para os lembretes.

## Segredos necessários

- `SUPABASE_URL` (já existe)
- `SUPABASE_SERVICE_ROLE_KEY` (já existe)
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT` (ex.: `mailto:voce@seudominio.com`)

A chave pública também precisa existir no frontend como `VITE_VAPID_PUBLIC_KEY`,
senão o card de notificações mostra "Notificações ainda não configuradas".

### Gerar o par VAPID

```bash
npx web-push generate-vapid-keys
```

Guarde `Public Key` e `Private Key` (formato base64url, P-256).

## Agendamento (a cada 1 minuto)

Rodar via `pg_cron` + `pg_net`, no próprio banco:

```sql
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'casa-hub-notification-processor',
  '* * * * *',
  $$
  select net.http_post(
    url := 'https://<PROJECT_REF>.supabase.co/functions/v1/notification-processor',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer <ANON_KEY>","apikey":"<ANON_KEY>"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
```

Acompanhar execuções:

```sql
select * from cron.job_run_details order by start_time desc limit 20;
```

## iPhone

No iOS, o push só funciona com o Casa Hub instalado na tela inicial
(Compartilhar → Adicionar à Tela de Início) e com a permissão concedida
dentro do app instalado. O card de notificações detecta esse caso e orienta
o usuário.

## Fluxo interno

1. `list_due_event_reminders` devolve os lembretes vencidos (função `SECURITY DEFINER`, executável apenas pela service role).
2. As entregas são inseridas com `ON CONFLICT (dedupe_key) DO NOTHING RETURNING *`, então só a execução que criou a linha envia o push — sem duplicidade.
3. O envio usa `aes128gcm` + VAPID; respostas `404/410` revogam a inscrição em `push_subscriptions`.
4. Cada entrega termina como `sent`, `failed` ou `expired`.
