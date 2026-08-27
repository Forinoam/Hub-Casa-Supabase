# Casa Hub — Análise de Arquitetura, Produto e Roadmap

Análise baseada na leitura do código atual (`src/modules/*`, rotas, migrations) e no linter do banco. Nada foi alterado.

## 1. Estado atual (o que já está bom)

- Arquitetura modular clara: `Página → Hook → Service → Banco`, com `models` para regra de negócio.
- Barramento de automação (`src/automation/`) desacoplando módulos por eventos de domínio.
- Contexto de Casa único (`HomeContext`) com todas as query keys namespaced por `homeId`.
- Notificações push funcionando ponta a ponta (VAPID + cron + service worker).
- MCP/OAuth expondo o app para agentes externos — diferencial raro nesse segmento.

## 2. Problemas encontrados, por prioridade

### CRÍTICO


| #   | Problema                                                                                                                                                                                                  | Benefício de corrigir                                                                     | Complexidade | Impacto no usuário         | Tecnologia                            |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------ | -------------------------- | ------------------------------------- |
| C1  | Falta de índices no banco: só `tasks` e tabelas de notificação têm índice. `events`, `expenses`, `shopping_items`, `maintenance_items`, `memories`, `categories`, `home_members` fazem scan por `home_id` | Listas e dashboard deixam de degradar conforme a casa acumula histórico                   | Baixa        | Alto (velocidade)          | Postgres index em `(home_id, data)`   |
| C2  | Função `SECURITY DEFINER` executável por qualquer usuário logado (apontada pelo linter)                                                                                                                   | Fecha caminho de escalonamento de privilégio                                              | Baixa        | Invisível, mas é segurança | `REVOKE EXECUTE` / `SECURITY INVOKER` |
| C3  | Zero testes automatizados em regras críticas (recorrência, índice da casa, insights, split conta×gasto)                                                                                                   | Impede regressões silenciosas — o app já teve bug de persistência que passou despercebido | Média        | Indireto, alto             | Vitest sobre `models/` e `utils/`     |


### ALTO


| #   | Problema                                                                                             | Benefício                                                      | Complexidade | Impacto  | Tecnologia                                     |
| --- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ------------ | -------- | ---------------------------------------------- |
| A1  | Gamificação modelada no banco (`achievements`, `task_history`) mas sem nenhuma tela                  | Recupera o principal gancho de engajamento para casais         | Média        | Alto     | Rota `/gamificacao` + serviço de ranking       |
| A2  | Rotas gordas: `financeiro.tsx` (510 linhas) e `calendario.tsx` (460) misturam UI, formulário e regra | Manutenção e reuso; hoje qualquer ajuste arrisca o módulo todo | Média        | Indireto | Extrair `components/` e `forms/` por módulo    |
| A3  | Sem `head()` em nenhuma rota — sem título, descrição ou preview de compartilhamento                  | Descoberta, indexação e link bonito no WhatsApp                | Baixa        | Médio    | `head()` do TanStack Router                    |
| A4  | Sem updates otimistas nem estado offline: em 4G ruim, marcar tarefa parece travar                    | Sensação de app nativo                                         | Média        | Alto     | React Query `onMutate` + persistência de cache |
| A5  | Sem tratamento global de erro/reconexão; falhas viram toast genérico                                 | Confiança; menos "salvou e sumiu"                              | Baixa        | Médio    | `QueryCache.onError` + error boundary por rota |
| A6  | IA sem memória de longo prazo e sem embeddings: cada conversa começa do zero                         | Assistente que conhece a rotina da casa                        | Média        | Alto     | `pgvector` + resumo periódico                  |


### MÉDIO


| #   | Problema                                                        | Benefício                           | Complexidade | Impacto       | Tecnologia                              |
| --- | --------------------------------------------------------------- | ----------------------------------- | ------------ | ------------- | --------------------------------------- |
| M1  | Sem busca global (Cmd+K) — 12 telas e nenhum atalho             | Acesso rápido a qualquer item       | Média        | Médio         | `cmdk` (já instalado)                   |
| M2  | Anexos inexistentes: contas e manutenções sem comprovante/foto  | Substitui a pasta de papéis da casa | Média        | Médio         | Storage + upload                        |
| M3  | Sem analytics de produto — nenhuma visibilidade de uso          | Decisão baseada em dado             | Baixa        | Nenhum direto | Analytics do Lovable / eventos próprios |
| M4  | Sem exportação (CSV/PDF) do financeiro                          | Fechamento mensal, imposto          | Baixa        | Médio         | Geração client-side                     |
| M5  | Categorias sem cor aplicada de forma consistente nas listas     | Leitura visual mais rápida          | Baixa        | Médio         | `entity-visuals.ts`                     |
| M6  | Sem paginação/virtualização — todo histórico carrega de uma vez | Escala além do primeiro ano de uso  | Média        | Médio         | `useInfiniteQuery`                      |
| M7  | Sem centro de notificações in-app (só push)                     | Nada se perde quando o push falha   | Média        | Médio         | Feed lido de `notification_deliveries`  |


### BAIXO

- B1 Sem modo escuro. B2 Sem i18n (PT fixo). B3 Sem acessibilidade auditada (foco, contraste, leitor de tela). B4 Sem skeletons consistentes entre módulos. B5 `ajuda.tsx` estática, sem onboarding guiado.

## 3. Modelagem de dados — melhorias recomendadas

- Índices compostos por `(home_id, <coluna de data>)` em todas as tabelas de conteúdo (C1).
- `priority`, `kind`, `visibility`, `status`, `recurrence` hoje são `text` livre: virar `enum` ou `CHECK` para impedir dado inválido.
- `expenses` acumula conta a pagar e gasto realizado na mesma tabela via `kind`. Funciona, mas ganharia com uma view separada por tipo para simplificar as consultas.
- Falta tabela de orçamento mensal por categoria — pré-requisito de qualquer alerta financeiro útil.
- `task_history` existe mas não alimenta nenhuma métrica de divisão de trabalho por pessoa.
- `memories` sem `photo_url` real (sem bucket de storage configurado).
- Soft delete ausente: exclusão é definitiva, sem lixeira.

## 4. Automações que reduziriam trabalho manual

1. Conta paga recorrente → gerar a próxima já com o valor do mês anterior como sugestão.
2. Item comprado com frequência → sugerir recompra pelo intervalo médio, sem depender de estoque.
3. Compromisso criado com palavra-chave ("médico", "viagem") → sugerir checklist de tarefas.
4. Manutenção concluída → agendar próxima e criar a despesa prevista.
5. Resumo semanal da casa por push no domingo à noite.
6. Distribuição automática de tarefas por rodízio entre membros.
7. Import de extrato/foto de recibo → despesa preenchida por IA.

## 5. Funcionalidades com IA de alto valor

- Assistente com memória da casa (embeddings sobre tarefas, contas e rotinas).
- Leitura de foto de nota fiscal → lançamento financeiro completo.
- Planejador semanal: a IA propõe a agenda da casa considerando carga de cada pessoa.
- Detecção de anomalia em contas ("luz 40% acima da média").
- Voz: ditar item de compra ou tarefa direto do celular.
- Relatório mensal narrado da casa.
- Conversa para determinar rotina: o app vai descobrir a rotina do usuário atraves de um relato do proprio usuario. Uma frase ou um texto que o usuário fale e a IA entenda a rotina. Depois será criado um painel onde o usuário poderá alterar essa rotina.

## 6. Integrações recomendadas

- **Storage** para comprovantes e fotos de memórias (pré-requisito de M2).
- **E-mail transacional** para convites e resumo semanal.
- **Google Calendar / Apple Calendar (ICS)** — sincronização bidirecional ou pelo menos feed exportável.
- **Open Finance / import OFX-CSV** para o financeiro sair da digitação manual.
- **Pagamentos** apenas se houver plano premium (multi-casa, IA ilimitada, histórico longo).
- **Analytics + monitoramento de erro** para enxergar falhas reais em produção.

## 7. O que uma empresa de tecnologia madura faria diferente

- Suíte de testes cobrindo regra de negócio e um teste de ponta a ponta por fluxo crítico.
- Feature flags e rollout gradual em vez de deploy direto.
- Observabilidade: rastreio de erro por usuário, métricas de latência de query.
- Design system documentado, com tokens auditados por contraste.
- Migrations revisadas com política de rollback.
- Estratégia offline-first assumida desde o início num app que é PWA de celular.

## 8. Roadmap

### Imediatas (1–2 dias)

- C1 índices no banco; C2 correção do linter.
- A3 metadados `head()` por rota.
- A5 tratamento global de erro e reconexão.
- M5 cor de categoria aplicada nas listas; M3 analytics básico.

### Curto prazo (1–2 semanas)

- A4 updates otimistas nos toggles de tarefa, compra e conta.
- A2 quebra de `financeiro.tsx` e `calendario.tsx` em componentes por módulo.
- C3 testes de `models/` e `utils/`.
- M1 busca global Cmd+K; M4 exportação do financeiro.
- Criação de um módulo de lembretes.

### Médio prazo (1–2 meses)

- Storage + anexos (comprovantes, fotos de memórias).
- Orçamento mensal por categoria com alertas.
- Centro de notificações in-app + resumo semanal por push.
- A6 IA com memória da casa; leitura de recibo por foto.
- Paginação/virtualização dos históricos.

### Longo prazo

- Sincronização com Google/Apple Calendar.
- Import bancário no financeiro.
- Offline-first completo com fila de sincronização.
- Modo multi-casa avançado (casa de praia, república, casa dos pais) com relatórios comparativos.
- A1 área de Gamificação (ranking, conquistas, histórico) usando as tabelas existentes.
- Plano premium e cobrança.

## 9. Ideias que diferenciam o produto

- **Carga mental medida**: painel que mostra quem está carregando mais a casa, com sugestão de rebalanceamento — é o problema real de casais, e nenhum concorrente mede isso.
- **Modo Casal**: acordo semanal de divisão de tarefas, negociado no app.
- **Linha do tempo da casa**: memórias, reformas, manutenções e contas num histórico único e exportável — vira o "prontuário" do imóvel, com valor de venda/aluguel.
- Conversa para determinar rotina: o app vai descobrir a rotina do usuário atraves de um relato do proprio usuario. Uma frase ou um texto que o usuário fale e a IA entenda a rotina. Depois será criado um painel onde o usuário poderá alterar essa rotina.
- **Agente da casa via MCP** (a base já existe): pedir pelo assistente do celular "adiciona leite na lista".
- **Modo mudança / obra**: projeto temporário com checklist, orçamento e prazo.
- **Convidado temporário + membro da casa sem conta**: acesso limitado para diarista, cuidador ou pet sitter. Além de criar membros como crianças sem conta e o próprio pet. 