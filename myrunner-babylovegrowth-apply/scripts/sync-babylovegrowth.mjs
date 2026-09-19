#!/usr/bin/env node
/**
 * Sync BabyLoveGrowth articles into local storage (src/content/babylovegrowth/articles.json).
 *
 * Usage:
 *   BABYLOVEGROWTH_API_KEY=... npm run sync:babylovegrowth
 *
 * Never call the API from page views — only this script / scheduled job.
 * Rate limits: ≤2 req/s, ≤30/min. We wait ≥2100ms between calls.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const STORE_PATH = join(ROOT, "src/content/babylovegrowth/articles.json");
const STATE_PATH = join(ROOT, "src/content/babylovegrowth/sync-state.json");

const BASE = "https://api.babylovegrowth.ai/api/integrations";
const USER_AGENT = "MyRunner/1.0 (+https://myrunner.shop)";
const PAGE_LIMIT = 50;
const MIN_GAP_MS = 2100;
const DETAIL_BUDGET = 40;
const CALL_BUDGET = 60;

// --- sanitize (kept in sync with src/lib/babylovegrowth/sanitize.ts) ---
function sanitizeArticleHtml(html) {
  if (!html) return "";
  let out = html;
  out = out.replace(
    /<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi,
    "",
  );
  out = out.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
  out = out.replace(/<\/?(?:object|embed|base)\b[^>]*>/gi, "");
  out = out.replace(/\s+srcdoc\s*=\s*(["'])[\s\S]*?\1/gi, "");
  out = out.replace(/\s+on[a-z]+\s*=\s*(["'])[\s\S]*?\1/gi, "");
  out = out.replace(/\s+on[a-z]+\s*=\s*[^\s>]+/gi, "");
  out = out.replace(
    /\s+(href|src|xlink:href)\s*=\s*(["'])\s*(?:javascript|data):[\s\S]*?\2/gi,
    "",
  );
  out = out.replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, (tag) => {
    const srcMatch = tag.match(/\ssrc\s*=\s*(["'])([^"']+)\1/i);
    if (!srcMatch) return "";
    let host = "";
    try {
      host = new URL(srcMatch[2]).hostname.replace(/^www\./, "");
    } catch {
      return "";
    }
    const allowed = new Set([
      "youtube.com",
      "youtube-nocookie.com",
      "youtu.be",
      "vimeo.com",
      "player.vimeo.com",
    ]);
    if (!allowed.has(host) && !host.endsWith(".youtube.com") && !host.endsWith(".vimeo.com")) {
      return "";
    }
    let cleaned = tag.replace(/\s+sandbox\s*=\s*(["'])[\s\S]*?\1/gi, "");
    cleaned = cleaned.replace(
      /<iframe\b/i,
      '<iframe sandbox="allow-scripts allow-same-origin allow-presentation"',
    );
    return cleaned;
  });
  return out;
}

function loadJson(path, fallback) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return fallback;
  }
}

function saveJson(path, data) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

let nextAllowedAt = 0;
let apiCalls = 0;

async function apiGet(path) {
  const key = process.env.BABYLOVEGROWTH_API_KEY;
  if (!key) {
    throw new Error(
      "BABYLOVEGROWTH_API_KEY is not set. Add it to your environment (never commit the key).",
    );
  }

  const wait = nextAllowedAt - Date.now();
  if (wait > 0) await sleep(wait);

  apiCalls += 1;
  const res = await fetch(`${BASE}${path}`, {
    method: "GET",
    headers: {
      "X-API-Key": key,
      "Content-Type": "application/json",
      "User-Agent": USER_AGENT,
    },
    signal: AbortSignal.timeout(15_000),
  });

  nextAllowedAt = Date.now() + MIN_GAP_MS;

  if (res.status === 429) {
    const retryAfter = Number(res.headers.get("Retry-After") || "60");
    nextAllowedAt = Date.now() + retryAfter * 1000;
    const err = new Error(`Rate limited (429). Retry-After=${retryAfter}s`);
    err.code = 429;
    throw err;
  }
  if (res.status === 401) {
    const err = new Error("Unauthorized (401): check BABYLOVEGROWTH_API_KEY");
    err.code = 401;
    throw err;
  }
  if (res.status === 403) {
    const err = new Error(
      "Forbidden (403): usually a missing/blocked User-Agent — this script sets User-Agent: MyRunner/1.0",
    );
    err.code = 403;
    throw err;
  }
  if (res.status === 404) {
    const err = new Error(`Not found (404): ${path}`);
    err.code = 404;
    throw err;
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API ${res.status} for ${path}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

function normalizeListPayload(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.articles)) return payload.articles;
  if (payload && Array.isArray(payload.data)) return payload.data;
  if (payload && Array.isArray(payload.items)) return payload.items;
  return [];
}

function mapArticle(detail, existing) {
  const slug = String(detail.slug || "").trim();
  if (!slug) throw new Error(`Article ${detail.id} missing slug`);

  const previousSlugs = [...(existing?.previousSlugs ?? [])];
  if (existing?.slug && existing.slug !== slug && !previousSlugs.includes(existing.slug)) {
    previousSlugs.push(existing.slug);
  }

  return {
    id: detail.id,
    title: detail.title ?? existing?.title ?? "Untitled",
    slug,
    previousSlugs,
    meta_description: detail.meta_description ?? detail.metaDescription ?? null,
    hero_image_url: detail.hero_image_url ?? detail.heroImageUrl ?? null,
    content_html: sanitizeArticleHtml(detail.content_html ?? detail.contentHtml ?? ""),
    content_markdown: detail.content_markdown ?? detail.contentMarkdown ?? null,
    jsonLd: detail.jsonLd ?? detail.json_ld ?? null,
    faqJsonLd: detail.faqJsonLd ?? detail.faq_json_ld ?? null,
    languageCode: detail.languageCode ?? detail.language_code ?? null,
    publishedAt:
      detail.publishedAt ??
      detail.published_at ??
      detail.created_at ??
      existing?.publishedAt ??
      null,
    created_at: detail.created_at ?? existing?.created_at ?? null,
    updated_at: detail.updated_at ?? existing?.updated_at ?? null,
    synced_at: new Date().toISOString(),
  };
}

function needsDetail(summary, byId) {
  const existing = byId.get(String(summary.id));
  if (!existing) return true;
  if (!existing.content_html) return true;
  const remoteUpdated = Date.parse(summary.updated_at || "") || 0;
  const localUpdated = Date.parse(existing.updated_at || "") || 0;
  return remoteUpdated > localUpdated;
}

async function main() {
  const store = loadJson(STORE_PATH, { syncedAt: null, articles: [] });
  const state = loadJson(STATE_PATH, {
    list_offset: 0,
    list_complete: false,
    last_run_at: null,
  });

  const byId = new Map(store.articles.map((a) => [String(a.id), a]));
  let listOffset = state.list_offset || 0;
  let listComplete = Boolean(state.list_complete);
  let detailFetches = 0;
  let synced = 0;
  let hit429 = false;

  console.log(
    `[blg-sync] start offset=${listOffset} complete=${listComplete} stored=${byId.size}`,
  );

  // Fresh scan when previous scan finished
  if (listComplete) {
    listOffset = 0;
    listComplete = false;
  }

  try {
    while (apiCalls < CALL_BUDGET && detailFetches < DETAIL_BUDGET) {
      const page = normalizeListPayload(
        await apiGet(`/v1/articles?limit=${PAGE_LIMIT}&offset=${listOffset}`),
      );

      if (page.length === 0) {
        listComplete = true;
        listOffset = 0;
        break;
      }

      let pageDone = true;
      for (const summary of page) {
        if (apiCalls >= CALL_BUDGET || detailFetches >= DETAIL_BUDGET) {
          pageDone = false;
          break;
        }
        if (!needsDetail(summary, byId)) continue;

        try {
          detailFetches += 1;
          const detail = await apiGet(`/v1/articles/${summary.id}`);
          const existing = byId.get(String(summary.id));
          const mapped = mapArticle({ ...summary, ...detail }, existing);
          byId.set(String(mapped.id), mapped);
          synced += 1;
          console.log(`[blg-sync] upsert slug=${mapped.slug} id=${mapped.id}`);
        } catch (e) {
          if (e.code === 404) {
            console.warn(`[blg-sync] skip missing id=${summary.id}`);
            continue;
          }
          if (e.code === 429) {
            hit429 = true;
            pageDone = false;
            console.warn(`[blg-sync] ${e.message}`);
            break;
          }
          throw e;
        }
      }

      if (hit429) break;

      if (pageDone) {
        if (page.length < PAGE_LIMIT) {
          listComplete = true;
          listOffset = 0;
          break;
        }
        listOffset += PAGE_LIMIT;
      } else {
        // Stay on this page so the next run finishes leftovers
        break;
      }
    }
  } finally {
    const articles = [...byId.values()].sort((a, b) => {
      const ta = Date.parse(a.publishedAt || a.created_at || "") || 0;
      const tb = Date.parse(b.publishedAt || b.created_at || "") || 0;
      return tb - ta;
    });

    saveJson(STORE_PATH, {
      syncedAt: new Date().toISOString(),
      articles,
    });
    saveJson(STATE_PATH, {
      list_offset: listOffset,
      list_complete: listComplete,
      last_run_at: new Date().toISOString(),
    });
  }

  console.log(
    JSON.stringify(
      {
        synced,
        total: byId.size,
        apiCalls,
        detailFetches,
        listOffset,
        listComplete,
        hit429,
        store: STORE_PATH,
      },
      null,
      2,
    ),
  );

  if (synced === 0 && byId.size === 0 && !hit429) {
    console.warn(
      "[blg-sync] No articles stored. Confirm the API key has published content in BabyLoveGrowth.",
    );
  }
}

main().catch((err) => {
  console.error("[blg-sync] failed:", err.message || err);
  process.exit(1);
});
