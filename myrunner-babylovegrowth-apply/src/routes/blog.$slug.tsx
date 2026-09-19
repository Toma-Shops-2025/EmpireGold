import { createFileRoute, Link, redirect, notFound } from "@tanstack/react-router";
import { PageShell } from "@/components/site/page-shell";
import { getBlgArticleBySlug } from "@/lib/babylovegrowth/articles.server";
import {
  articleUrl,
  rewriteJsonLdUrls,
  serializeJsonLd,
} from "@/lib/babylovegrowth/jsonld";

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    const result = await getBlgArticleBySlug({ data: { slug: params.slug } });
    if (!result.article) throw notFound();
    if (result.redirectFrom && result.article.slug !== params.slug) {
      throw redirect({
        to: "/blog/$slug",
        params: { slug: result.article.slug },
      });
    }
    return { article: result.article };
  },
  head: ({ loaderData }) => {
    const article = loaderData?.article;
    if (!article) {
      return { meta: [{ title: "Article — MyRunner" }] };
    }
    const url = articleUrl(article.slug);
    const description = article.meta_description || article.title;
    const scripts: Array<{ type: string; children: string }> = [];

    if (article.jsonLd) {
      scripts.push({
        type: "application/ld+json",
        children: serializeJsonLd(rewriteJsonLdUrls(article.jsonLd, article.slug)),
      });
    }
    if (article.faqJsonLd) {
      scripts.push({
        type: "application/ld+json",
        children: serializeJsonLd(rewriteJsonLdUrls(article.faqJsonLd, article.slug)),
      });
    }

    return {
      meta: [
        { title: `${article.title} — MyRunner` },
        { name: "description", content: description },
        { property: "og:title", content: article.title },
        { property: "og:description", content: description },
        { property: "og:url", content: url },
        { property: "og:type", content: "article" },
        ...(article.hero_image_url
          ? [
              { property: "og:image", content: article.hero_image_url },
              { name: "twitter:card", content: "summary_large_image" },
              { name: "twitter:image", content: article.hero_image_url },
            ]
          : [{ name: "twitter:card", content: "summary" }]),
        ...(article.publishedAt
          ? [{ property: "article:published_time", content: article.publishedAt }]
          : []),
      ],
      links: [{ rel: "canonical", href: `/blog/${article.slug}` }],
      scripts,
    };
  },
  component: BlogArticle,
  notFoundComponent: () => (
    <PageShell>
      <section className="container-app py-20 text-center">
        <h1 className="font-serif text-4xl">Article not found</h1>
        <p className="mt-3 text-muted-foreground">This post may have moved or been removed.</p>
        <Link to="/blog" className="mt-6 inline-block text-gold hover:underline">
          Back to blog
        </Link>
      </section>
    </PageShell>
  ),
});

function BlogArticle() {
  const { article } = Route.useLoaderData();

  return (
    <PageShell backFallback="/blog">
      <article
        lang={article.languageCode || undefined}
        className="container-app pb-24 pt-6"
      >
        <Link
          to="/blog"
          className="text-sm text-muted-foreground transition-colors hover:text-gold"
        >
          ← Back to blog
        </Link>

        {/* content_html from BabyLoveGrowth already includes h1 + hero — do not duplicate */}
        <div
          className="prose-blg mx-auto mt-8 max-w-3xl"
          dangerouslySetInnerHTML={{ __html: article.content_html }}
        />
      </article>
    </PageShell>
  );
}
