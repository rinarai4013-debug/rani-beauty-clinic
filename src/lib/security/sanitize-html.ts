const DISALLOWED_BLOCK_TAGS = ['script', 'style', 'iframe', 'object', 'embed', 'link', 'meta', 'base'];
const DISALLOWED_INLINE_TAGS = ['script', 'style', 'iframe', 'object', 'embed', 'link', 'meta', 'base'];

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function sanitizeTrustedHtml(html: string): string {
  if (!html) return '';

  let sanitized = html;

  for (const tag of DISALLOWED_BLOCK_TAGS) {
    const pairPattern = new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, 'gi');
    sanitized = sanitized.replace(pairPattern, '');
  }

  for (const tag of DISALLOWED_INLINE_TAGS) {
    const singlePattern = new RegExp(`<${tag}\\b[^>]*\\/?>`, 'gi');
    sanitized = sanitized.replace(singlePattern, '');
  }

  // Remove inline event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');

  // Remove javascript: URLs in href/src attributes
  sanitized = sanitized.replace(/\s(href|src)\s*=\s*(['"])\s*javascript:[\s\S]*?\2/gi, '');

  return sanitized;
}
