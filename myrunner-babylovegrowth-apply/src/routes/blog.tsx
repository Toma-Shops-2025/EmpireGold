import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/site/page-shell";
import { listArticlesFromStore } from "@/lib/babylovegrowth/articles";

export const Route = createFileRoute("/blog")({
  loader: async () => {
    const articles = listArticlesFromStore();
    return { articles };
  },
  head: () => ({
    meta: [
      { title: "Blog — MyRunner delivery tips & guides" },
      {
        name: "description",
        content:
          "Guides and updates from MyRunner — on-demand local delivery for anything, anytime, anywhere.",
      },
      { property: "og:title", content: "MyRunner Blog" },
      {
        property: "og:description",
        content: "Tips, guides, and updates for MyRunner customers and drivers.",
      },
      { property: "og:url", content: "/blog" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/blog" }],
  }),
  component: BlogIndex,
});

function BlogIndex() {
  const { articles } = Route.useLoaderData();
  const languages = [...new Set(articles.map((a) => a.languageCode).filter(Boolean))];

  return (
    <PageShell>
      <section className="container-app py-20">
        <p className="text-xs uppercase tracking-widest text-gold">Blog</p>
        <h1 className="mt-3 font-serif text-6xl leading-[1.05]">Stories &amp; guides.</h1>
        <p className="mt-4 max-w-xl text-muted-foreground">
          Practical delivery tips and MyRunner updates — synced from our content library.
        </p>
        {languages.length > 1 ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Languages live: {languages.join(", ")}
          </p>
        ) : null}
      </section>

      <section className="container-app pb-24">
        {articles.length === 0 ? (
          <div className="mx-auto max-w-xl rounded-2xl border border-border bg-card px-8 py-12 text-center">
            <h2 className="font-serif text-2xl">No articles yet</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Run <code className="text-gold">npm run sync:babylovegrowth</code> with{" "}
              <code className="text-gold">BABYLOVEGROWTH_API_KEY</code> set, or wait for the
              scheduled GitHub Action sync.
            </p>
          </div>
        ) : (
          <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => {
              const dateLabel = formatDate(article.publishedAt || article.created_at);
              return (
                <li key={article.slug} lang={article.languageCode || undefined}>
                  <Link
                    to="/blog/$slug"
                    params={{ slug: article.slug }}
                    className="group block h-full overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-gold/40"
                  >
                    {article.hero_image_url ? (
                      <div className="aspect-[16/10] overflow-hidden bg-surface">
                        <img
                          src={article.hero_image_url}
                          alt=""
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div className="aspect-[16/10] bg-noise bg-surface" />
                    )}
                    <div className="p-5">
                      {dateLabel ? (
                        <p className="text-xs uppercase tracking-widest text-muted-foreground">
                          {dateLabel}
                        </p>
                      ) : null}
                      <h2 className="mt-2 font-serif text-2xl leading-snug group-hover:text-gold">
                        {article.title}
                      </h2>
                      {article.meta_description ? (
                        <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                          {article.meta_description}
                        </p>
                      ) : null}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </PageShell>
  );
}

function formatDate(value: string | null | undefined) {
  if (!value) return null;
  const t = Date.parse(value);
  if (!Number.isFinite(t)) return null;
  return new Date(t).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
