# Automação (arquitetura reservada)

Camada preparada para automações futuras — ainda **sem implementação**.

Quando ativada, orquestrará fluxos como:

```
Compra concluída → atualiza estoque → registra despesa
                → atualiza dashboard → IA aprende consumo
                → sugere nova compra
```

## Estrutura

- `events/` — definição de eventos de domínio (nomes + payloads tipados).
- `handlers/` — reações a esses eventos (side-effects idempotentes).

Nenhum módulo depende desta pasta atualmente. Adicionar aqui é
opt-in: um `serviço` publica um evento e um `handler` reage.
