import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/shared/utils/head";
import { AppShell } from "@/shared/components/AppShell";
import { CardBlock } from "@/components/ui/card-block";

export const Route = createFileRoute("/_authenticated/ajuda")({
  head: () => pageHead({
    title: "Ajuda — Casa Hub",
    description: "Dúvidas frequentes sobre casas, convites, permissões e módulos do Casa Hub.",
    path: "/ajuda",
    noindex: true,
  }),
  component: HelpPage,
});

const TOPICS = [
  {
    q: "Como funciona uma casa?",
    a: "Tudo no Casa Hub pertence a uma casa. Tarefas, compras, finanças e memórias são compartilhados entre os moradores dela.",
  },
  {
    q: "Como convido alguém?",
    a: "Em Família, toque no ícone de convidar, informe o e-mail e envie o código gerado. A pessoa entra pela tela de convites.",
  },
  {
    q: "Posso participar de mais de uma casa?",
    a: "Sim. Use o Menu da Casa para trocar de casa a qualquer momento; a escolha fica salva no seu perfil.",
  },
  {
    q: "Quem pode mudar as configurações?",
    a: "Proprietário e administradores. Membros podem usar todos os módulos, mas não alteram a casa nem removem moradores.",
  },
];

function HelpPage() {
  return (
    <AppShell subtitle="Ajuda" title="Como usar o Casa Hub">
      <div className="space-y-3">
        {TOPICS.map((t) => (
          <CardBlock key={t.q}>
            <p className="text-sm font-semibold">{t.q}</p>
            <p className="mt-1 text-sm text-sage-800/70">{t.a}</p>
          </CardBlock>
        ))}
      </div>
    </AppShell>
  );
}
