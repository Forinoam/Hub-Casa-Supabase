import type { Handler } from "../bus";

/**
 * Shopping → Financeiro bridge (parcial).
 *
 * A tabela `shopping_items` ainda NÃO possui um campo de valor/preço, então
 * hoje uma compra concluída não tem como virar uma despesa real. Este
 * handler existe para deixar o fluxo pronto: se, no futuro, o evento
 * `shopping.completed` chegar com `amount` preenchido, criamos a despesa
 * automaticamente. Caso contrário, apenas registramos que o gancho existe.
 *
 * Para concluir esta integração no futuro é necessário:
 *   1. Adicionar coluna `price numeric` (ou `total`) em `public.shopping_items`.
 *   2. Capturar o valor no formulário de compras / no toggle de "comprado".
 *   3. Propagar esse valor no payload de `shopping.completed`.
 *   4. Descomentar o bloco abaixo para gravar em `expenses`.
 */
export const handleShoppingToExpense: Handler<"shopping.completed"> = async (event) => {
  if (event.amount == null || Number.isNaN(event.amount) || event.amount <= 0) {
    // Sem valor conhecido — arquitetura pronta, nada a fazer nesta sprint.
    return;
  }

  // Preparado para o futuro (mantido comentado para não gravar despesa vazia):
  //
  // const { createExpense } = await import("@/modules/finance/services/finance.service");
  // const { getCurrentUserId } = await import("@/shared/services/auth.service");
  // const userId = await getCurrentUserId();
  // await createExpense(event.homeId, userId, {
  //   description: event.name,
  //   amount: event.amount,
  //   category: "Mercado",
  //   due_date: new Date().toISOString().slice(0, 10),
  // });
  // emit({ type: "expense.created", homeId: event.homeId, expenseId: created.id, ... });
};
