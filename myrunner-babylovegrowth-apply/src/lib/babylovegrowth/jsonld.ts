const SITE_ORIGIN = "https://myrunner.shop";

/** Absolute URL for a blog post on this site. */
export function articleUrl(slug: string): string {
  return `${SITE_ORIGIN}/blog/${slug}`;
}

export function siteOrigin(): string {
  return SITE_ORIGIN;
}

/**
 * Rewrite article URLs inside BabyLoveGrowth JSON-LD so they point at MyRunner,
 * not the BLG-generated main-website URLs. Leaves author/publisher alone.
 */
export function rewriteJsonLdUrls(data: unknown, slug: string): unknown {
  if (data == null) return data;
  const live = articleUrl(slug);

  const walk = (node: unknown, path: string[]): unknown => {
    if (Array.isArray(node)) {
      return node.map((item, i) => walk(item, [...path, String(i)]));
    }
    if (!node || typeof node !== "object") return node;

    const obj = node as Record<string, unknown>;
    const type = obj["@type"];
    const types = Array.isArray(type) ? type.map(String) : type ? [String(type)] : [];
    const out: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      if (key === "author" || key === "publisher") {
        out[key] = value;
        continue;
      }

      const isArticle = types.some((t) => /Article|BlogPosting|WebPage/i.test(t));
      if (isArticle && (key === "url" || key === "mainEntityOfPage")) {
        out[key] =
          key === "mainEntityOfPage" && value && typeof value === "object"
            ? walk({ ...(value as object), "@id": live, "@type": (value as { "@type"?: string })["@type"] ?? "WebPage" }, [
                ...path,
                key,
              ])
            : live;
        continue;
      }

      if (types.includes("ListItem") && key === "item") {
        // Only rewrite the last breadcrumb item (handled by parent BreadcrumbList)
        out[key] = value;
        continue;
      }

      if (types.includes("BreadcrumbList") && key === "itemListElement" && Array.isArray(value)) {
        out[key] = value.map((item, idx) => {
          const walked = walk(item, [...path, key, String(idx)]) as Record<string, unknown>;
          if (idx === value.length - 1 && walked && typeof walked === "object") {
            return { ...walked, item: live };
          }
          return walked;
        });
        continue;
      }

      out[key] = walk(value, [...path, key]);
    }
    return out;
  };

  return walk(data, []);
}

/** Safe JSON-LD serialization for <script type="application/ld+json">. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
