/**
 * Sanitize BabyLoveGrowth HTML once at sync time so pages can render trustedly.
 * Strips JSON-LD script blocks (re-injected in head), event handlers, dangerous
 * URLs, and untrusted embeds — matching BabyLoveGrowth Lovable integration rules.
 */
export function sanitizeArticleHtml(html: string): string {
  if (!html) return "";
  let out = html;

  // Strip JSON-LD script blocks (we re-inject corrected schema in <head>)
  out = out.replace(
    /<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi,
    "",
  );
  // Strip any remaining script tags
  out = out.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");

  // Drop object / embed / base
  out = out.replace(/<\/?(?:object|embed|base)\b[^>]*>/gi, "");

  // Drop srcdoc attributes
  out = out.replace(/\s+srcdoc\s*=\s*(["'])[\s\S]*?\1/gi, "");

  // Drop on* event handlers
  out = out.replace(/\s+on[a-z]+\s*=\s*(["'])[\s\S]*?\1/gi, "");
  out = out.replace(/\s+on[a-z]+\s*=\s*[^\s>]+/gi, "");

  // Drop javascript: / data: in href, src, xlink:href
  out = out.replace(
    /\s+(href|src|xlink:href)\s*=\s*(["'])\s*(?:javascript|data):[\s\S]*?\2/gi,
    "",
  );

  // iframe: keep only youtube / vimeo; sandbox them
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
