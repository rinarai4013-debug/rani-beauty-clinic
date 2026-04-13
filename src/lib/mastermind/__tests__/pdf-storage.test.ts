import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { storePdf, retrievePdf, pdfExists } from '../pdf-storage';
import { rmdir, mkdir } from 'fs/promises';
import { join } from 'path';

// Use /tmp for test isolation
const TEST_DIR = '/tmp/rani-pdfs-test';

describe('pdf-storage', () => {
  beforeEach(async () => {
    try { await mkdir(TEST_DIR, { recursive: true }); } catch { /* ok */ }
  });

  afterEach(async () => {
    try { await rmdir(TEST_DIR, { recursive: true } as never); } catch { /* ok */ }
  });

  it('stores and retrieves PDF HTML', async () => {
    const html = '<html><body>Test PDF</body></html>';
    const stored = await storePdf(html, 'test-plan.pdf');

    expect(stored.filename).toBe('test-plan.pdf');
    expect(stored.url).toContain('/api/mastermind/pdf/serve');
    expect(stored.url).toContain('test-plan.pdf');
    expect(stored.sizeBytes).toBeGreaterThan(0);
    expect(stored.storedAt).toBeTruthy();

    // Retrieve
    const retrieved = await retrievePdf('test-plan.pdf');
    expect(retrieved).toBe(html);
  });

  it('returns null for missing file', async () => {
    const result = await retrievePdf('nonexistent.pdf');
    expect(result).toBeNull();
  });

  it('sanitizes filenames', async () => {
    const html = '<html>test</html>';
    const stored = await storePdf(html, 'file with spaces & <chars>.pdf');
    expect(stored.filename).toMatch(/^[a-zA-Z0-9._-]+$/);
  });

  it('checks file existence', async () => {
    const html = '<html>exists</html>';
    await storePdf(html, 'exists-check.pdf');

    expect(await pdfExists('exists-check.pdf')).toBe(true);
    expect(await pdfExists('missing.pdf')).toBe(false);
  });

  it('includes base URL in generated URL', async () => {
    const html = '<html>test</html>';
    const stored = await storePdf(html, 'baseurl.pdf', 'https://example.com');
    expect(stored.url).toContain('https://example.com');
  });
});
