import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listHomes from "./tools/list-homes";
import houseSummary from "./tools/house-summary";
import listTasks from "./tools/list-tasks";
import createTask from "./tools/create-task";
import completeTask from "./tools/complete-task";
import listShoppingItems from "./tools/list-shopping-items";
import addShoppingItem from "./tools/add-shopping-item";
import listExpenses from "./tools/list-expenses";
import listEvents from "./tools/list-events";
import createEvent from "./tools/create-event";

const projectRef = import.meta.env['VITE_SUPABASE_PROJECT_ID'] ?? "project-ref-unset";

export default defineMcp({
  name: "casa-hub",
  title: "Casa Hub",
  version: "0.1.0",
  instructions:
    "Ferramentas do Casa Hub, a central de organização doméstica. Use `house_summary` para um panorama da casa, e as ferramentas de tarefas, compras, financeiro e agenda para consultar ou registrar informações. Todas operam na casa do usuário autenticado; o `home_id` é opcional e assume a casa padrão.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    listHomes,
    houseSummary,
    listTasks,
    createTask,
    completeTask,
    listShoppingItems,
    addShoppingItem,
    listExpenses,
    listEvents,
    createEvent,
  ],
});
