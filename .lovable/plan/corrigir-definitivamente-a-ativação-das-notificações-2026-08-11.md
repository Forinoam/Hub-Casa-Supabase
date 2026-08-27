# Corrigir definitivamente a ativação das notificações

## Causa exata confirmada

O problema não está no iPhone, na permissão nem no tempo de espera.

- O `/sw.js` publicado responde normalmente com HTTP 200.
- Porém, o manifesto de precache embutido nele aponta para arquivos como `client/assets/index-j2Mhnwl6.js`.
- No app publicado, esses endereços retornam **404**; os arquivos reais estão em `assets/index-j2Mhnwl6.js`.
- Quando qualquer item obrigatório do precache falha, o Service Worker não conclui a instalação.
- Por isso ele nunca fica ativo e `navigator.serviceWorker.ready` termina sempre na mensagem “O Service Worker não ficou pronto”. Fechar, reabrir ou reinstalar sem corrigir o build não poderia resolver.

## Correção

1. **Corrigir as URLs geradas no precache**
   - Ajustar a configuração `injectManifest` do `vite-plugin-pwa` para remover o prefixo incorreto `client/` das URLs geradas.
   - Manter o mesmo `/sw.js`, escopo `/` e os handlers de push existentes.
   - Desativar a geração de Service Worker em desenvolvimento/preview, conforme a guarda já existente no app.

2. **Tornar a espera de ativação determinística**
   - Fazer o registro retornar o `ServiceWorkerRegistration` criado/encontrado.
   - Aguardar explicitamente o estado `activated` do worker em `installing`, `waiting` ou `active`, em vez de depender apenas da promessa global `navigator.serviceWorker.ready`.
   - Se a instalação entrar em `redundant`, informar que o worker falhou ao instalar, sem recomendar repetidamente fechar e reabrir.

3. **Eliminar registro concorrente**
   - Centralizar o registro em um único fluxo para evitar que o hook global e o botão tentem registrar `/sw.js` ao mesmo tempo.
   - Preservar a limpeza automática apenas nos ambientes de preview/desenvolvimento.

## Validação obrigatória

Antes de considerar concluído:

- Verificar no artefato gerado que o precache contém `assets/...`, nunca `client/assets/...`.
- Confirmar que cada URL do precache responde 200 no app publicado.
- Confirmar que `/sw.js` chega aos estados `installed` e `activated` com escopo `/`.
- Executar o fluxo real: ativar notificações, criar a inscrição em `PushManager`, salvar no backend e enviar uma notificação de teste.
- Confirmar que a atualização do `/sw.js` substitui o worker quebrado existente; reinstalar o ícone só será solicitado se o Safari mantiver a instalação antiga após a publicação corrigida.

Nenhuma alteração será feita no processamento VAPID, no envio das notificações, nas tabelas ou nas automações existentes.
