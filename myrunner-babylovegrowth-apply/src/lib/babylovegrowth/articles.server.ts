import { createServerFn } from "@tanstack/react-start";
import type { BlgArticle, BlgArticleStore, BlgArticleSummary } from "./types";
import store from "@/content/babylovegrowth/articles.json";

function getStore(): BlgArticleStore {
  const data = store as BlgArticleStore;
  return {
    syncedAt: data.syncedAt ?? null,
    articles: Array.isArray(data.articles) ? data.articles : [],
  };
}

export function listArticlesFromStore(): BlgArticleSummary[] {
  return getStore()
    .articles.slice()
    .sort((a, b) => {
      const ta = Date.parse(a.publishedAt || a.created_at || "") || 0;
      const tb = Date.parse(b.publishedAt || b.created_at || "") || 0;
      return tb - ta;
    })
    .map((a) => ({
      id: a.id,
      title: a.title,
      slug: a.slug,
      meta_description: a.meta_description,
      hero_image_url: a.hero_image_url,
      languageCode: a.languageCode,
      publishedAt: a.publishedAt,
      created_at: a.created_at,
      updated_at: a.updated_at,
    }));
}

export function getArticleBySlugFromStore(slug: string): {
  article: BlgArticle | null;
  redirectFrom?: string;
} {
  const articles = getStore().articles;
  const direct = articles.find((a) => a.slug === slug);
  if (direct) return { article: direct };

  const prev = articles.find((a) => (a.previousSlugs ?? []).includes(slug));
  if (prev) return { article: prev, redirectFrom: slug };
  return { article: null };
}

export const listBlgArticles = createServerFn({ method: "GET" }).handler(async () => {
  return listArticlesFromStore();
});

export const getBlgArticleBySlug = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => {
    if (!d || typeof d !== "object" || typeof (d as { slug?: unknown }).slug !== "string") {
      throw new Error("slug required");
    }
    return { slug: (d as { slug: string }).slug };
  })
  .handler(async ({ data }) => getArticleBySlugFromStore(data.slug));
