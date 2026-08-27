# Corrigir "O Service Worker não ficou pronto"

## Diagnóstico (verificado agora)

- No ambiente de **preview/desenvolvimento** o arquivo `/sw.js` **não existe** (retorna 404). O console do preview confirma: falha ao registrar o service worker com "bad HTTP response code (404)".
- No app **publicado** (`hub-casa.lovable.app`) o `/sw.js` existe e responde 200.

Conclusão: a ativação trava porque o app tenta registrar um service worker que só existe na versão publicada. Se o Casa Hub foi instalado na tela inicial a partir do endereço de preview, as notificações nunca vão ativar — fechar e reabrir não resolve, porque o arquivo simplesmente não é servido ali.

## O que vou mudar

1. **Registro do service worker com guarda de ambiente**
   Passar a registrar o service worker apenas no app publicado (fora de preview, iframe e desenvolvimento), e desregistrar automaticamente registros antigos nesses ambientes. Isso elimina o erro 404 recorrente no console.

2. **Estado claro no card de Notificações**
   Quando o app estiver rodando em preview/desenvolvimento, o card mostra uma mensagem explícita ("Notificações push funcionam apenas no app publicado — instale a partir de hub-casa.lovable.app") em vez de oferecer o botão que sempre falha.

3. **Mensagem de erro mais precisa**
   Antes de registrar, verificar se o service worker está disponível; se não estiver, retornar um erro que diga o motivo real em vez de "feche e reabra o app instalado".

Nada do fluxo de push já funcionando (VAPID, salvamento de inscrição, envio de teste, edge function) será alterado.

## O que você precisa fazer no iPhone

Depois do ajuste: remover o ícone atual da tela de início, abrir **https://hub-casa.lovable.app** no Safari, "Adicionar à Tela de Início" a partir desse endereço, abrir pelo ícone e então tocar em "Ativar notificações".

## Detalhes técnicos

- `src/shared/hooks/use-pwa-registration.ts`: guarda de contexto (`import.meta.env.PROD`, iframe, hostnames `*.lovableproject.com` / `preview--*` / `id-preview--*`, `?sw=off`) + `unregister()` dos registros de `/sw.js` nesses casos.
- `src/modules/notifications/services/push-notifications.service.ts`: nova checagem de disponibilidade do SW usada por `ensureServiceWorkerRegistration`, com mensagem específica.
- `src/modules/notifications/hooks/use-push-notifications.ts` + `PushNotificationsCard.tsx`: novo modo de UI para ambiente de preview (sem botão de ativar).
