/**
 * Helper de metadados por rota. Centraliza título, descrição, Open Graph e
 * canonical para que cada página tenha identidade própria ao ser compartilhada.
 */
const SITE = "https://hub-casa.lovable.app";

type PageHeadInput = {
  title: string;
  description: string;
  path: string;
  /** Páginas internas da casa não devem ser indexadas. */
  noindex?: boolean;
};

export function pageHead({ title, description, path, noindex }: PageHeadInput) {
  const url = `${SITE}${path}`;
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: url },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      ...(noindex ? [{ name: "robots", content: "noindex, nofollow" }] : []),
    ],
    links: [{ rel: "canonical", href: url }],
  };
}
