# Notificações no Android: o que dá para afirmar hoje

Resposta curta: **ainda não posso garantir 100%**. Verifiquei o banco de inscrições e todos os
dispositivos registrados até agora são Apple (`web.push.apple.com`, 4 inscrições). Nenhum
aparelho Android/Chrome (`fcm.googleapis.com`) jamais se inscreveu, então o caminho de entrega
do Google nunca foi exercitado de verdade neste projeto.

O que já está tecnicamente correto e é o mesmo para os dois sistemas:
- O envio usa Web Push padrão (VAPID + aes128gcm), que é exatamente o que o Chrome/Android exige.
- O service worker mostra notificação em todo push recebido — requisito obrigatório do Chrome
  (se um push chegasse sem notificação visível, o Android puniria o app).
- Clique na notificação abre/foca a janela certa; inscrições removidas (404/410) são revogadas.
- No Android não existe a exigência de "instalar na tela de início" que o iOS impõe, então o
  fluxo de ativação é mais simples, não mais difícil.

## Ajustes que eu recomendo antes de dizer "funciona no Android"

1. **Ícone de badge correto**: hoje o badge usa um PNG colorido 192px. O Android espera um ícone
   monocromático pequeno; com o atual, a barra de status pode mostrar um quadrado cinza.
   Gerar um `badge-72.png` monocromático e usá-lo no service worker.
2. **TTL maior**: hoje o push expira em 15 minutos. Se o celular estiver sem rede ou em economia
   de bateria (comum no Android), o lembrete simplesmente some. Subir para 24h nos lembretes.
3. **Urgência dos lembretes**: usar `Urgency: high` para lembretes com hora marcada, para reduzir
   atraso quando o aparelho está em Doze mode.
4. **`renotify` + `vibrate`**: com `tag` definido e sem `renotify`, uma segunda notificação do
   mesmo item substitui a anterior em silêncio no Android. Ativar `renotify: true`.
5. **Texto de erro específico**: se o Chrome/Android bloquear a permissão, a mensagem atual é
   genérica; incluir a instrução certa para Android (Configurações do site > Notificações).

## Como confirmar de verdade sem ter um Android

O Chrome no desktop usa **o mesmo serviço de push do Android (FCM)**. Então:
- Você abre o app publicado no Chrome do computador, ativa as notificações e usa o botão
  "Enviar notificação de teste".
- Eu leio no banco a inscrição criada e o resultado do envio (entregue/erro) e te digo se o
  caminho do Google está saudável.

Isso valida servidor, criptografia, VAPID e service worker no caminho FCM. A única diferença que
sobra para o celular Android é a apresentação da notificação no sistema, que os ajustes acima
cobrem.

## Detalhes técnicos

- `src/sw.ts`: badge monocromático, `renotify: true`, `vibrate`, manter `tag` por item.
- `supabase/functions/notification-processor/webpush.ts`: TTL configurável (padrão 86400) e
  cabeçalho `Urgency` por tipo de notificação.
- `supabase/functions/notification-processor/index.ts`: passar urgência/TTL conforme o tipo.
- `public/icons/badge-72.png`: novo ícone monocromático.
- Nenhuma mudança de banco de dados; nada do fluxo iOS que já funciona é alterado.
