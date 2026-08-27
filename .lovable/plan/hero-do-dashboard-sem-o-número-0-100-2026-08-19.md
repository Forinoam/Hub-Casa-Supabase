# Hero do Dashboard sem o número 0–100

O card de abertura continua sendo o "como está minha casa agora", mas deixa de mostrar a nota de 0 a 100 e a barra de progresso. No lugar entra uma leitura em linguagem humana e um caminho de ação claro.

## Nova estrutura do card

```text
 SEG, 18 DE AGOSTO
 Bom dia, Matheus

 [ • ] Sua casa precisa de atenção
 3 pontos exigem sua atenção hoje

 [Tarefas 2 atrasadas] [Contas 1 vence hoje] [Manutenção em dia]

 ( Ver o que precisa de atenção → )
```

1. **Data + saudação** — permanecem como estão hoje.
2. **Status da casa** — o mesmo rótulo já calculado ("Tudo em dia", "Boa, com pontos a cuidar", "Precisa de atenção"), agora em destaque grande, com um ponto colorido no tom correspondente (verde / âmbar / terracota) em vez do número.
3. **Contagem de atenção** — "N pontos exigem sua atenção" continua, ganhando peso visual. Quando N = 0, vira uma mensagem convidativa ("Nada urgente agora. Bom momento para respirar." / sugestão leve).
4. **Chips por área** — quatro pastilhas curtas (Tarefas, Compras, Contas, Manutenção) mostrando o que há de concreto em cada uma ("2 atrasadas", "em dia"), coloridas pelo estado. Substituem a barra: mostram *onde* está o problema, não uma nota abstrata.
5. **Botão de ação** — leva direto para a seção de Prioridades do Dia (ou para o módulo do chip clicado), tornando o card acionável.

Chips clicáveis: cada um navega para o módulo correspondente já filtrado no que importa.

## Detalhes técnicos

- `computeHouseIndex` continua existindo e calculando `score` internamente (ele decide `label` e `tone`, e é usado por insights). O `score` deixa de ser renderizado; o `breakdown` por área passa a alimentar os chips em vez de ficar sem uso.
- Mudanças concentradas em `src/modules/dashboard/components/HeroCard.tsx`: remover número, `/100` e barra; adicionar bloco de status, chips derivados do `breakdown` + contagens reais, e CTA.
- `src/routes/index.tsx` passa ao HeroCard as contagens por área já disponíveis em `useDashboardSummary` (tarefas atrasadas, contas a vencer, compras pendentes, manutenções próximas), para os chips mostrarem números concretos em vez de porcentagem.
- Estado vazio/positivo tratado no próprio HeroCard.
- Nenhuma alteração em banco, automações ou outros módulos.
