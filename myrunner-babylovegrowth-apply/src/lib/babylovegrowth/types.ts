/** BabyLoveGrowth article as stored locally (synced; never fetched on page view). */
export type BlgArticle = {
  id: number | string;
  title: string;
  slug: string;
  previousSlugs: string[];
  meta_description: string | null;
  hero_image_url: string | null;
  content_html: string;
  content_markdown: string | null;
  jsonLd: unknown | null;
  faqJsonLd: unknown | null;
  languageCode: string | null;
  publishedAt: string | null;
  created_at: string | null;
  updated_at: string | null;
  synced_at: string;
};

export type BlgArticleStore = {
  syncedAt: string | null;
  articles: BlgArticle[];
};

export type BlgArticleSummary = Pick<
  BlgArticle,
  | "id"
  | "title"
  | "slug"
  | "meta_description"
  | "hero_image_url"
  | "languageCode"
  | "publishedAt"
  | "created_at"
  | "updated_at"
>;
