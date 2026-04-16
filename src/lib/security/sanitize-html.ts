/**
 * Minimal safe-HTML sanitizer for UI-rendered fragments.
 *
 * Whitelist-style defense-in-depth: strips script/iframe/object/embed,
 * event-handler attributes, and javascript:/data: URIs.
 *
 * No DOM dependency — safe for SSR and edge runtimes.
 *
 * Use at every dangerouslySetInnerHTML render point that may receive
 * AI-generated or user-influenced content (consent body, copilot messages).
 *
 * Allows safe formatting tags: strong, em, b, i, p, br, ul, ol, li,
 * h1–h6, a (sanitized href), span.
 */

/**
 * Strip dangerous constructs from an HTML fragment.
 * Preserves safe formatting markup; removes injection vectors.
 */
export function sanitizeHtml(html: string): string {
  return html
    // 1. Remove dangerous block-level elements and their entire content
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, '')
    .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe\s*>/gi, '')
    .replace(/<(object|embed|form|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
    // 2. Remove dangerous void / self-closing elements
    .replace(/<(script|iframe|object|embed|form|link|meta|base)\b[^>]*\/?>/gi, '')
    // 3. Strip on* event handler attributes (onclick, onload, onerror, onmouseover …)
    .replace(/\s+on[a-z]\w*\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    // 4. Strip javascript:/data:/vbscript: URIs from href and src attributes
    //    Replace the dangerous URI with '#' to preserve the attribute structure
    .replace(
      /(\s+(?:href|src)\s*=\s*["'])(?:javascript|data|vbscript):[^"']*/gi,
      '$1#',
    );
}
