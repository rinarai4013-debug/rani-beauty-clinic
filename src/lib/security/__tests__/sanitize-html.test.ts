import { describe, expect, it } from 'vitest';
import { escapeHtml, sanitizeTrustedHtml } from '@/lib/security/sanitize-html';

describe('escapeHtml', () => {
  it('escapes dangerous characters', () => {
    const raw = `<div class="x" data-y='z'>& hello</div>`;
    expect(escapeHtml(raw)).toBe(
      '&lt;div class=&quot;x&quot; data-y=&#39;z&#39;&gt;&amp; hello&lt;/div&gt;',
    );
  });
});

describe('sanitizeTrustedHtml', () => {
  it('removes dangerous block tags and content', () => {
    const raw = '<p>safe</p><script>alert("x")</script><style>body{display:none}</style>';
    expect(sanitizeTrustedHtml(raw)).toBe('<p>safe</p>');
  });

  it('removes dangerous singleton tags', () => {
    const raw = '<p>ok</p><iframe src="https://x.test"></iframe><meta charset="utf-8">';
    expect(sanitizeTrustedHtml(raw)).toBe('<p>ok</p>');
  });

  it('strips inline event handlers', () => {
    const raw = '<img src="https://x.test/a.png" onerror="alert(1)"><p onclick="x()">ok</p>';
    expect(sanitizeTrustedHtml(raw)).toBe('<img src="https://x.test/a.png"><p>ok</p>');
  });

  it('strips javascript: href/src payloads', () => {
    const raw = '<a href="javascript:alert(1)">x</a><img src=\'javascript:alert(2)\'>';
    expect(sanitizeTrustedHtml(raw)).toBe('<a>x</a><img>');
  });

  it('returns empty string for empty input', () => {
    expect(sanitizeTrustedHtml('')).toBe('');
  });
});
