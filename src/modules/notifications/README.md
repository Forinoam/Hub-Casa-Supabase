# Notificações Push

Fase 3 do Casa Hub: ativação e desativação de notificações Web Push, com persistência segura em `push_subscriptions`.

## Variável de ambiente

- `VITE_VAPID_PUBLIC_KEY`

Configure essa variável:

- localmente no arquivo `.env` do projeto, ou em `.env.local` se preferir manter fora do controle de versão;
- no ambiente de produção, na configuração de variáveis do build/deploy que gera o bundle do Vite.

Esta fase usa apenas a chave pública no cliente. A chave privada VAPID continua reservada para a fase de envio real e não deve ir para o frontend.

## Fluxo atual

- detecta suporte a Service Worker, Notification e PushManager;
- solicita permissão só após clique explícito do usuário;
- cria ou reaproveita a PushSubscription;
- extrai endpoint, p256dh e auth;
- persiste a inscrição via action server-side autenticada;
- permite desativação com unsubscribe + revogação no backend.

## Observação de iPhone/iOS

Em iPhone/iPad, o app precisa ser instalado como PWA na tela inicial para o push funcionar corretamente.
