import type { BlgArticle, BlgArticleStore, BlgArticleSummary } from "./types";
import store from "@/content/babylovegrowth/articles.json";

/**
 * Read synced BabyLoveGrowth articles from local JSON storage.
 * No network calls — safe for SSR loaders without createServerFn/auth middleware.
 */
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
